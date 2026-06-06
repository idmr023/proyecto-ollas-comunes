import { prisma } from "../../lib/prisma"

export class MobileRepository {
  async getUserOlla(tenantId: string) {
    return prisma.ollaComun.findFirst({
      where: { tenantId, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, address: true },
    })
  }

  async getDailySummary(ollaId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const menuPlan = await prisma.menuPlan.findFirst({
      where: {
        ollaId,
        operationDate: { gte: today, lt: tomorrow },
        status: { in: ["draft", "approved", "executed"] },
      },
      select: { plannedServings: true, deliveries: { select: { totalRations: true } } },
    })

    if (!menuPlan) return { planificadas: 0, entregadas: 0 }

    const entregadas = menuPlan.deliveries.reduce((sum, d) => sum + d.totalRations, 0)
    return { planificadas: menuPlan.plannedServings, entregadas }
  }

  async getExpiringItems(ollaId: string) {
    const movements = await prisma.inventoryMovement.findMany({
      where: { ollaId },
      orderBy: { movementDate: "desc" },
      take: 50,
      include: {
        supplyItem: { select: { id: true, name: true, unit: true, isPerishable: true } },
      },
    })

    const itemMap = new Map<string, { name: string; unit: string; isPerishable: boolean; totalIn: number; totalOut: number }>()
    for (const m of movements) {
      const key = m.supplyItem.id
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          name: m.supplyItem.name,
          unit: m.supplyItem.unit,
          isPerishable: m.supplyItem.isPerishable,
          totalIn: 0,
          totalOut: 0,
        })
      }
      const entry = itemMap.get(key)!
      if (m.movementType === "in") {
        entry.totalIn += Number(m.quantity)
      } else {
        entry.totalOut += Number(m.quantity)
      }
    }

    const stock = await prisma.inventoryStock.findMany({
      where: { ollaId, quantity: { gt: 0 } },
      include: { supplyItem: { select: { name: true, unit: true, isPerishable: true } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
    })

    return stock
      .filter((s) => s.supplyItem.isPerishable)
      .map((s) => ({
        nombre: s.supplyItem.name,
        cantidad: `${Number(s.quantity)} ${s.supplyItem.unit}`,
        venceEn: "Próximamente",
      }))
  }

  async getInventory(ollaId: string) {
    const stock = await prisma.inventoryStock.findMany({
      where: { ollaId },
      include: {
        supplyItem: {
          select: { id: true, name: true, unit: true, isPerishable: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return stock.map((s) => ({
      id: s.supplyItem.id,
      nombre: s.supplyItem.name,
      cantidad: Number(s.quantity),
      unidad: s.supplyItem.unit,
      esPerecedero: s.supplyItem.isPerishable,
    }))
  }

  async getSupplyCategories() {
    return prisma.supplyCategory.findMany({
      include: {
        items: {
          where: { status: "active" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: { name: "asc" },
    })
  }

  async createMovement(data: {
    tenantId: string
    ollaId: string
    supplyItemId: string
    movementType: string
    quantity: number
    notes?: string
    createdBy?: string
  }) {
    return prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId: data.tenantId,
          ollaId: data.ollaId,
          supplyItemId: data.supplyItemId,
          movementType: data.movementType,
          quantity: data.quantity,
          notes: data.notes ?? null,
          createdBy: data.createdBy ?? null,
        },
      })

      const stockDelta = data.movementType === "in" ? data.quantity : -data.quantity

      await tx.inventoryStock.upsert({
        where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: data.supplyItemId } },
        create: { ollaId: data.ollaId, supplyItemId: data.supplyItemId, quantity: Math.max(0, stockDelta) },
        update: { quantity: { increment: stockDelta }, updatedAt: new Date() },
      })

      return movement
    })
  }

  async getAlerts(ollaId: string) {
    return prisma.alert.findMany({
      where: {
        ollaId,
        status: { not: "resolved" },
      },
      orderBy: { detectedAt: "desc" },
      take: 20,
      select: {
        id: true,
        alertType: true,
        severity: true,
        message: true,
        status: true,
        detectedAt: true,
      },
    })
  }

  async getSuggestions(tenantId: string, ollaId: string) {
    const expiringStock = await prisma.inventoryStock.findMany({
      where: { ollaId, quantity: { gt: 0 } },
      include: { supplyItem: { select: { name: true, unit: true, isPerishable: true } } },
      orderBy: { updatedAt: "asc" },
      take: 10,
    })

    const perecederos = expiringStock
      .filter((s) => s.supplyItem.isPerishable)
      .slice(0, 5)

    const suggestions = [
      {
        nombre: "Arroz con pollo y verduras",
        puntaje: 85,
        ingredientes: perecederos
          .filter((s) => ["pollo", "arroz", "zanahoria", "arveja", "papa"].some((k) => s.supplyItem.name.toLowerCase().includes(k)))
          .map((s) => `${s.supplyItem.name} (${Number(s.quantity)} ${s.supplyItem.unit})`),
      },
      {
        nombre: "Guiso de lentejas con arroz",
        puntaje: 92,
        ingredientes: perecederos
          .filter((s) => ["lenteja", "arroz", "cebolla", "zanahoria"].some((k) => s.supplyItem.name.toLowerCase().includes(k)))
          .map((s) => `${s.supplyItem.name} (${Number(s.quantity)} ${s.supplyItem.unit})`),
      },
    ]

    if (suggestions[0].ingredientes.length === 0 && suggestions[1].ingredientes.length === 0) {
      return [
        {
          nombre: "Saltado de verduras",
          puntaje: 78,
          ingredientes: perecederos.map(
            (s) => `${s.supplyItem.name} (${Number(s.quantity)} ${s.supplyItem.unit})`,
          ),
        },
      ]
    }

    return suggestions.filter((s) => s.ingredientes.length > 0).slice(0, 1)
  }
}

export const mobileRepository = new MobileRepository()
