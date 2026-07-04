import { mobileRepository } from './repository'
import { prisma } from '../../lib/prisma'

const db = prisma

export async function getMobileDashboard(tenantId: string, ollaId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [olla, stock, todayPlan, deliveries, beneficiaryCount, activeAlerts] =
    await Promise.all([
      mobileRepository.getDashboardOlla(tenantId, ollaId),
      mobileRepository.getStock(ollaId),
      mobileRepository.getTodayMenuPlan(ollaId, today),
      mobileRepository.getTodayDeliveries(ollaId, today),
      mobileRepository.getBeneficiaryCount(tenantId, ollaId),
      mobileRepository.getActiveAlerts(tenantId, ollaId),
    ])

  if (!olla) return null

  const totalDelivered = deliveries.reduce((sum: number, d: any) => sum + d.totalRations, 0)
  const totalStock = stock.reduce((sum: number, s: any) => sum + Number(s.quantity), 0)

  const lowStockAlerts = stock
    .filter((s: any) => Number(s.quantity) < 5)
    .map((s: any) => ({
      supplyItemName: s.supplyItem.name,
      quantity: Number(s.quantity),
      unit: s.supplyItem.unit,
      categoryName: s.supplyItem.category?.name || 'General',
    }))

  return {
    olla: { id: olla.id, name: olla.name },
    summary: {
      beneficiarios: beneficiaryCount,
      stockTotal: totalStock,
      menu: todayPlan
        ? {
            id: todayPlan.id,
            dishName: todayPlan.dishName,
            recipeName: todayPlan.recipe?.name || null,
            status: todayPlan.status,
            plannedServings: todayPlan.plannedServings,
            maxServingsRemaining: Math.max(0, todayPlan.plannedServings - totalDelivered),
          }
        : null,
      racionesEntregadas: totalDelivered,
    },
    stock: stock.map((s: any) => ({
      supplyItemId: s.supplyItemId,
      name: s.supplyItem.name,
      quantity: Number(s.quantity),
      unit: s.supplyItem.unit,
      categoryName: s.supplyItem.category?.name || 'General',
      updatedAt: s.updatedAt.toISOString(),
    })),
    lowStockAlerts,
    alerts: activeAlerts.map((a: any) => ({
      id: a.id,
      alertType: a.alertType,
      severity: a.severity,
      message: a.message,
      status: a.status,
      detectedAt: a.detectedAt.toISOString(),
    })),
  }
}

export async function registerInventoryMovement(
  tenantId: string,
  ollaId: string,
  payload: {
    supplyItemId: string
    movementType: string
    quantity: number
    sourceId?: string
    notes?: string
    createdBy?: string
  },
) {
  if (!['in', 'out', 'adjustment', 'waste'].includes(payload.movementType)) {
    throw new MobileServiceError(400, 'Tipo de movimiento inválido.')
  }
  if (!payload.quantity || payload.quantity <= 0) {
    throw new MobileServiceError(400, 'La cantidad debe ser mayor a 0.')
  }

  const supplyItem = await db.supplyItem.findUnique({
    where: { id: payload.supplyItemId },
  })
  if (!supplyItem) {
    throw new MobileServiceError(404, 'Insumo no encontrado.')
  }

  const movement = await (prisma as any).inventoryMovement.create({
    data: {
      tenantId,
      ollaId,
      supplyItemId: payload.supplyItemId,
      sourceId: payload.sourceId || undefined,
      movementType: payload.movementType,
      quantity: payload.quantity,
      notes: payload.notes || undefined,
      createdBy: payload.createdBy || undefined,
      movementDate: new Date(),
    },
  })

  await updateInventoryStock(ollaId, payload.supplyItemId, payload.movementType, payload.quantity)

  return {
    id: movement.id,
    supplyItemId: movement.supplyItemId,
    movementType: movement.movementType,
    quantity: Number(movement.quantity),
    movementDate: movement.movementDate.toISOString(),
    notes: movement.notes,
    supplyItemName: supplyItem.name,
    unit: supplyItem.unit,
  }
}

async function updateInventoryStock(
  ollaId: string,
  supplyItemId: string,
  movementType: string,
  quantity: number,
) {
  const existing = await db.inventoryStock.findUnique({
    where: { ollaId_supplyItemId: { ollaId, supplyItemId } },
  })

  const currentQty = existing ? Number(existing.quantity) : 0

  let newQty: number
  if (movementType === 'in' || movementType === 'adjustment') {
    newQty = currentQty + quantity
  } else {
    newQty = Math.max(0, currentQty - quantity)
  }

  await db.inventoryStock.upsert({
    where: { ollaId_supplyItemId: { ollaId, supplyItemId } },
    create: { ollaId, supplyItemId, quantity: newQty },
    update: { quantity: newQty, updatedAt: new Date() },
  })
}

export async function registerMealDelivery(
  ollaId: string,
  payload: {
    beneficiaryIds: string[]
    totalRations?: number
    dishName?: string
    createdBy?: string
  },
) {
  if (!payload.beneficiaryIds || payload.beneficiaryIds.length === 0) {
    throw new MobileServiceError(400, 'Debe seleccionar al menos un beneficiario para la entrega.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const menuPlan = await db.menuPlan.findFirst({
    where: { ollaId, operationDate: today },
    orderBy: { createdAt: 'desc' },
  })

  const planId = menuPlan?.id

  const totalRations = payload.totalRations || payload.beneficiaryIds.length

  const delivery = await db.mealDelivery.create({
    data: {
      menuPlanId: planId!,
      totalRations,
      createdBy: payload.createdBy ?? null,
      deliveredAt: new Date(),
      details: {
        create: payload.beneficiaryIds.map((beneficiaryId: string) => ({
          beneficiaryId,
          rationType: 'regular',
        })),
      },
    },
  })

  const detailRecords = await db.mealDeliveryDetail.findMany({
    where: { deliveryId: delivery.id },
    select: { beneficiaryId: true },
  })

  return {
    id: delivery.id,
    deliveredAt: delivery.deliveredAt.toISOString(),
    totalRations: delivery.totalRations,
    beneficiaryCount: detailRecords.length,
    dishName: payload.dishName || menuPlan?.dishName || 'Menú del día',
    beneficiaries: detailRecords.map((d: any) => d.beneficiaryId),
  }
}

export async function executeMenuPlan(
  tenantId: string,
  ollaId: string,
  payload: {
    dishName: string
    servings: number
    recipeId?: string
    createdBy?: string
  },
) {
  if (!payload.dishName || payload.dishName.trim().length === 0) {
    throw new MobileServiceError(400, 'El nombre del plato es obligatorio.')
  }
  if (!payload.servings || payload.servings <= 0) {
    throw new MobileServiceError(400, 'La cantidad de raciones debe ser mayor a 0.')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await db.menuPlan.findFirst({
    where: { ollaId, operationDate: today },
  })

  if (existing) {
    const updated = await db.menuPlan.update({
      where: { id: existing.id },
      data: {
        dishName: payload.dishName,
        plannedServings: payload.servings,
        recipeId: payload.recipeId || null,
        status: 'approved',
        suggestedByType: 'ia',
      },
    })
    return {
      id: updated.id,
      dishName: updated.dishName,
      plannedServings: updated.plannedServings,
      status: updated.status,
      operationDate: updated.operationDate.toISOString().split('T')[0],
    }
  }

  const plan = await db.menuPlan.create({
    data: {
      ollaId,
      dishName: payload.dishName,
      plannedServings: payload.servings,
      recipeId: payload.recipeId || null,
      suggestedByType: 'ia',
      createdBy: payload.createdBy || null,
      status: 'approved',
      operationDate: today,
    },
  })

  return {
    id: plan.id,
    dishName: plan.dishName,
    plannedServings: plan.plannedServings,
    status: plan.status,
    operationDate: plan.operationDate.toISOString().split('T')[0],
  }
}

export async function getMobileSuggestions(tenantId: string, ollaId: string) {
  const recommendations = await db.recommendation.findMany({
    where: { tenantId, ollaId, status: 'pending' },
    include: {
      relatedRecipe: { select: { name: true, estimatedServings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const expiringStock = await db.inventoryStock.findMany({
    where: { ollaId, quantity: { lt: 5, gt: 0 } },
    include: {
      supplyItem: { select: { name: true, unit: true, isPerishable: true } },
    },
  })

  return {
    recommendations: recommendations.map((r: any) => ({
      id: r.id,
      type: r.recommendationType,
      title: r.title,
      description: r.description,
      recipeName: r.relatedRecipe?.name || null,
      servings: r.relatedRecipe?.estimatedServings || null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    expiringStock: expiringStock.map((s: any) => ({
      supplyItemId: s.supplyItemId,
      name: s.supplyItem.name,
      quantity: Number(s.quantity),
      unit: s.supplyItem.unit,
      isPerishable: s.supplyItem.isPerishable,
    })),
  }
}

export async function getMobileAlerts(tenantId: string, ollaId: string) {
  const alerts = await db.alert.findMany({
    where: { tenantId, ollaId },
    orderBy: { detectedAt: 'desc' },
    take: 20,
  })

  return alerts.map((a: any) => ({
    id: a.id,
    alertType: a.alertType,
    severity: a.severity,
    message: a.message,
    status: a.status,
    detectedAt: a.detectedAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
  }))
}

export async function resolveMobileAlert(alertId: string, ollaId: string) {
  const alert = await db.alert.findFirst({
    where: { id: alertId, ollaId },
  })

  if (!alert) {
    throw new MobileServiceError(404, 'Alerta no encontrada.')
  }

  const updated = await db.alert.update({
    where: { id: alertId },
    data: { status: 'resolved', resolvedAt: new Date() },
  })

  return {
    id: updated.id,
    alertType: updated.alertType,
    severity: updated.severity,
    message: updated.message,
    status: updated.status,
    detectedAt: updated.detectedAt.toISOString(),
    resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
  }
}

export async function uploadMobileDocument(
  tenantId: string,
  ollaId: string,
  payload: {
    documentType: string
    title: string
    fileUrl: string
    description?: string
    uploadedBy?: string
  },
) {
  if (!payload.title || !payload.fileUrl) {
    throw new MobileServiceError(400, 'Título y URL del archivo son obligatorios.')
  }

  const validDocTypes = ['evidence', 'report', 'acta', 'photo', 'other']
  if (payload.documentType && !validDocTypes.includes(payload.documentType)) {
    throw new MobileServiceError(400, 'Tipo de documento inválido.')
  }

  const doc = await db.document.create({
    data: {
      tenantId,
      ollaId,
      documentType: (payload.documentType as any) || 'evidence',
      title: payload.title,
      fileUrl: payload.fileUrl,
      description: payload.description || null,
      uploadedBy: payload.uploadedBy || null,
    },
  })

  return {
    id: doc.id,
    title: doc.title,
    documentType: doc.documentType,
    fileUrl: doc.fileUrl,
    description: doc.description,
    uploadedAt: doc.uploadedAt.toISOString(),
  }
}

export class MobileServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'MobileServiceError'
  }
}
