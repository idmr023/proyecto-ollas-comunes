import { OrganizationServiceError } from './errors'
import { Organization, OrganizationPayload } from './types'
import { organizationRepository } from './repository'
import { prisma } from '../../lib/prisma'
import {
  buildOrganizationSlug,
  buildUniqueOrganizationCode,
  mapDatabaseStatus,
  sanitizeOrganizationText,
  toOrganization,
} from './utils'

function parseOrganizationPayload(payload: unknown): OrganizationPayload {
  if (!payload || typeof payload !== 'object') {
    throw new OrganizationServiceError(400, 'Datos invalidos para la organizacion.')
  }

  const data = payload as Record<string, unknown>
  const name = sanitizeOrganizationText(data.name, 150)
  const category = sanitizeOrganizationText(data.category, 100)
  const location = sanitizeOrganizationText(data.location, 100)

  if (!name || !category || !location) {
    throw new OrganizationServiceError(
      400,
      'Nombre, categoria y ubicacion son obligatorios.',
    )
  }

  return { name, category, location }
}

export async function listOrganizations(): Promise<Organization[]> {
  const records = await organizationRepository.findAll()
  return records.map(toOrganization)
}

export async function getOrganizationBySlug(slug: string): Promise<Organization> {
  const record = await organizationRepository.findBySlug(slug)

  if (!record) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  return toOrganization(record)
}

export async function createOrganization(payload: unknown): Promise<Organization> {
  const data = parseOrganizationPayload(payload)

  const exists = await organizationRepository.existsByName(data.name)
  if (exists) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const existingCodes = await organizationRepository.getExistingCodes()
  const code = buildUniqueOrganizationCode(data.name, existingCodes)

  const record = await organizationRepository.create({
    code,
    name: data.name,
    category: data.category,
    location: data.location,
    status: 'active',
  })

  return toOrganization(record)
}

export async function updateOrganizationBySlug(slug: string, payload: unknown): Promise<Organization> {
  const current = await organizationRepository.findBySlug(slug)

  if (!current) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const data = parseOrganizationPayload(payload)

  const hasDuplicate = await organizationRepository.findDuplicatesByName(current.id, data.name)
  if (hasDuplicate) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const updated = await organizationRepository.update(current.id, {
    name: data.name,
    category: data.category,
    location: data.location,
  })

  if (!updated) {
    throw new OrganizationServiceError(500, 'Error al actualizar la organizacion.')
  }

  return toOrganization(updated)
}

export async function updateOrganizationStatusBySlug(slug: string, status: unknown): Promise<Organization> {
  const current = await organizationRepository.findBySlug(slug)

  if (!current) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const updated = await organizationRepository.update(current.id, {
    status: mapDatabaseStatus(status),
  })

  if (!updated) {
    throw new OrganizationServiceError(500, 'Error al actualizar el estado de la organizacion.')
  }

  return toOrganization(updated)
}

export async function getAdminDashboard(tenantId: string) {
  // 1. Obtener conteos de las entidades clave
  const [tenantsCount, ollasCount, beneficiariesCount, supplyItemsCount] = await Promise.all([
    prisma.tenant.count({ where: { status: 'active' } }),
    prisma.ollaComun.count({ where: { tenantId, status: 'active' } }),
    prisma.beneficiary.count({ where: { tenantId, status: 'active' } }),
    prisma.supplyItem.count({ where: { status: 'active' } }),
  ])

  // 2. Obtener alertas recientes (actividades de la base de datos)
  const alerts = await prisma.alert.findMany({
    where: { tenantId },
    orderBy: { detectedAt: 'desc' },
    take: 10,
    include: {
      olla: { select: { name: true } }
    }
  })

  // 3. Obtener insumos con stock crítico (menos de 5 unidades)
  const lowStockItems = await prisma.inventoryStock.findMany({
    where: {
      olla: { tenantId },
      quantity: { lt: 5 }
    },
    include: {
      supplyItem: true,
      olla: true
    },
    orderBy: { quantity: 'asc' },
    take: 5
  })

  // 4. Stock distribution for donut chart
  const allStock = await prisma.inventoryStock.findMany({
    where: { olla: { tenantId } },
    select: { quantity: true }
  })
  let stockAdequate = 0, stockLow = 0, stockCritical = 0
  for (const s of allStock) {
    const q = Number(s.quantity)
    if (q === 0) stockCritical++
    else if (q < 5) stockLow++
    else stockAdequate++
  }

  // 5. Beneficiary evolution (last 6 months)
  const evolution: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const count = await prisma.beneficiary.count({
      where: { tenantId, registeredAt: { lte: end } }
    })
    evolution.push({ month: start.toLocaleString('es-PE', { month: 'short' }), count })
  }

  return {
    kpis: {
      tenants: tenantsCount,
      ollas: ollasCount,
      beneficiaries: beneficiariesCount,
      supplyItems: supplyItemsCount,
    },
    charts: {
      stockDistribution: { adequate: stockAdequate, low: stockLow, critical: stockCritical },
      beneficiaryEvolution: evolution,
    },
    activities: alerts.map(a => ({
      id: a.id,
      alertType: a.alertType,
      message: a.message,
      detectedAt: a.detectedAt.toISOString(),
      ollaName: a.olla?.name || 'Sistema'
    })),
    lowStock: lowStockItems.map(ls => ({
      name: ls.supplyItem.name,
      ollaName: ls.olla.name,
      stock: `${Number(ls.quantity)} ${ls.supplyItem.unit}`,
      isCritical: Number(ls.quantity) === 0
    }))
  }
}

export async function getTenantInventoryStock(tenantId: string) {
  const stock = await prisma.inventoryStock.findMany({
    where: {
      olla: { tenantId }
    },
    include: {
      olla: { select: { name: true } },
      supplyItem: { select: { name: true, unit: true, category: { select: { name: true } } } }
    },
    orderBy: [
      { olla: { name: 'asc' } },
      { supplyItem: { name: 'asc' } }
    ]
  })

  return stock.map(s => ({
    ollaName: s.olla.name,
    ollaId: s.ollaId,
    supplyItemId: s.supplyItemId,
    supplyItemName: s.supplyItem.name,
    categoryName: s.supplyItem.category?.name || 'General',
    quantity: Number(s.quantity),
    unit: s.supplyItem.unit,
    updatedAt: s.updatedAt.toISOString()
  }))
}

export async function getTenantInventoryMovements(tenantId: string) {
  const movements = await prisma.inventoryMovement.findMany({
    where: { tenantId },
    include: {
      olla: { select: { name: true } },
      supplyItem: { select: { name: true, unit: true } },
      source: { select: { name: true } },
      createdByUser: { select: { fullName: true } }
    },
    orderBy: { movementDate: 'desc' },
    take: 100
  })

  return movements.map(m => ({
    id: m.id,
    ollaName: m.olla.name,
    ollaId: m.ollaId,
    supplyItemName: m.supplyItem.name,
    unit: m.supplyItem.unit,
    movementType: m.movementType,
    quantity: Number(m.quantity),
    movementDate: m.movementDate.toISOString(),
    notes: m.notes,
    sourceName: m.source?.name || null,
    createdByName: m.createdByUser?.fullName || 'Sistema'
  }))
}

export async function getTenantAlerts(tenantId: string) {
  const alerts = await prisma.alert.findMany({
    where: { tenantId },
    include: {
      olla: { select: { name: true } }
    },
    orderBy: { detectedAt: 'desc' }
  })

  return alerts.map(a => ({
    id: a.id,
    ollaName: a.olla?.name || 'Sistema',
    ollaId: a.ollaId,
    alertType: a.alertType,
    severity: a.severity,
    message: a.message,
    status: a.status,
    detectedAt: a.detectedAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null
  }))
}

export async function getReportsSummary(tenantId: string, from?: string, to?: string, ollaId?: string) {
  const dateFilter: any = {}
  if (from || to) {
    dateFilter.movementDate = {}
    if (from) dateFilter.movementDate.gte = new Date(from)
    if (to) dateFilter.movementDate.lte = new Date(to + "T23:59:59.999Z")
  }

  const ollaFilter: any = { tenantId }
  if (ollaId) ollaFilter.id = ollaId

  const [inMovements, outMovements, totalIncome, totalOutgoing, ollas, beneficiaries, deliveries] = await Promise.all([
    prisma.inventoryMovement.count({ where: { ...dateFilter, movementType: "in", olla: { tenantId }, ...(ollaId ? { ollaId } : {}) } }),
    prisma.inventoryMovement.count({ where: { ...dateFilter, movementType: "out", olla: { tenantId }, ...(ollaId ? { ollaId } : {}) } }),
    prisma.inventoryMovement.aggregate({ _sum: { quantity: true }, where: { ...dateFilter, movementType: "in", olla: { tenantId }, ...(ollaId ? { ollaId } : {}) } }),
    prisma.inventoryMovement.aggregate({ _sum: { quantity: true }, where: { ...dateFilter, movementType: "out", olla: { tenantId }, ...(ollaId ? { ollaId } : {}) } }),
    prisma.ollaComun.findMany({ where: ollaFilter, select: { id: true, name: true } }),
    prisma.beneficiary.count({ where: { tenantId, status: "active", ...(ollaId ? { ollaId } : {}) } }),
    prisma.mealDelivery.count({
      where: {
        menuPlan: { olla: { tenantId } },
        ...(ollaId ? { menuPlan: { ollaId } } : {}),
        ...(from || to ? { deliveredAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
        } } : {}),
      }
    }),
  ])

  const movementList = await prisma.inventoryMovement.findMany({
    where: { ...dateFilter, olla: { tenantId }, ...(ollaId ? { ollaId } : {}) },
    include: { olla: { select: { name: true } }, supplyItem: { select: { name: true, unit: true } } },
    orderBy: { movementDate: "desc" },
    take: 200,
  })

  return {
    summary: {
      ingresos: inMovements,
      salidas: outMovements,
      totalIngresado: Number(totalIncome._sum.quantity ?? 0),
      totalEgresado: Number(totalOutgoing._sum.quantity ?? 0),
      ollas: ollas.length,
      beneficiarios: beneficiaries,
      entregas: deliveries,
    },
    ollas: ollas,
    movements: movementList.map(m => ({
      id: m.id,
      ollaName: m.olla.name,
      supplyItemName: m.supplyItem.name,
      unit: m.supplyItem.unit,
      movementType: m.movementType,
      quantity: Number(m.quantity),
      movementDate: m.movementDate.toISOString(),
      notes: m.notes,
    })),
  }
}

export async function updateTenantAlert(id: string, tenantId: string, status: string) {
  const alert = await prisma.alert.findFirst({
    where: { id, tenantId }
  })

  if (!alert) {
    throw new OrganizationServiceError(404, 'Alerta no encontrada.')
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === 'resolved' ? new Date() : undefined
    },
    include: {
      olla: { select: { name: true } }
    }
  })

  return {
    id: updated.id,
    ollaName: updated.olla?.name || 'Sistema',
    ollaId: updated.ollaId,
    alertType: updated.alertType,
    severity: updated.severity,
    message: updated.message,
    status: updated.status,
    detectedAt: updated.detectedAt.toISOString(),
    resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null
  }
}


