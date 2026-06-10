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

  async createMealDelivery(data: {
    tenantId: string
    ollaId: string
    userId: string
    beneficiaryIds: string[]
    totalRations: number
    dishName?: string
  }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.$transaction(async (tx) => {
      // 1. Get or create today's MenuPlan
      let menuPlan = await tx.menuPlan.findFirst({
        where: {
          ollaId: data.ollaId,
          operationDate: { gte: today, lt: tomorrow },
        },
      })

      if (!menuPlan) {
        menuPlan = await tx.menuPlan.create({
          data: {
            ollaId: data.ollaId,
            operationDate: today,
            dishName: data.dishName || "Almuerzo Comunitario",
            plannedServings: data.totalRations || data.beneficiaryIds.length,
            status: "executed",
            suggestedByType: "user",
            createdBy: data.userId,
          },
        })
      } else {
        await tx.menuPlan.update({
          where: { id: menuPlan.id },
          data: { status: "executed" },
        })
      }

      // 2. Create MealDelivery
      const delivery = await tx.mealDelivery.create({
        data: {
          menuPlanId: menuPlan.id,
          totalRations: data.totalRations || data.beneficiaryIds.length,
          createdBy: data.userId,
        },
      })

      // 3. Create MealDeliveryDetail for each beneficiary
      if (data.beneficiaryIds && data.beneficiaryIds.length > 0) {
        const detailsData = data.beneficiaryIds.map((bId) => ({
          deliveryId: delivery.id,
          beneficiaryId: bId,
          rationType: "estandar",
        }))

        await tx.mealDeliveryDetail.createMany({
          data: detailsData,
          skipDuplicates: true,
        })
      }

      return delivery
    })
  }

  async executeMenuPlan(data: {
    tenantId: string
    ollaId: string
    userId: string
    recipeId?: string
    dishName: string
    servings: number
  }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.$transaction(async (tx) => {
      // 1. Get or create today's MenuPlan
      let menuPlan = await tx.menuPlan.findFirst({
        where: {
          ollaId: data.ollaId,
          operationDate: { gte: today, lt: tomorrow },
        },
      })

      let recipe = null
      if (data.recipeId) {
        recipe = await tx.recipe.findUnique({
          where: { id: data.recipeId },
          include: { ingredients: true },
        })
      }

      if (!menuPlan) {
        menuPlan = await tx.menuPlan.create({
          data: {
            ollaId: data.ollaId,
            operationDate: today,
            dishName: data.dishName,
            plannedServings: data.servings,
            recipeId: recipe?.id || null,
            status: "executed",
            suggestedByType: recipe ? "user" : "ia",
            createdBy: data.userId,
          },
        })
      } else {
        await tx.menuPlan.update({
          where: { id: menuPlan.id },
          data: {
            status: "executed",
            dishName: data.dishName,
            recipeId: recipe?.id || menuPlan.recipeId,
          },
        })
      }

      // 2. Discount Stock based on recipe or fallback mock ingredients
      const itemsToDiscount: { supplyItemId: string; quantity: number }[] = []

      if (recipe && recipe.ingredients.length > 0) {
        const factor = data.servings / (recipe.estimatedServings || 1)
        for (const ing of recipe.ingredients) {
          itemsToDiscount.push({
            supplyItemId: ing.supplyItemId,
            quantity: Number(ing.quantity) * factor,
          })
        }
      } else {
        // Fallback: match by names for the mock dishes
        const lowerDish = data.dishName.toLowerCase()
        let keywords: string[] = []
        if (lowerDish.includes("pollo")) {
          keywords = ["arroz", "pollo", "zanahoria", "papa"]
        } else if (lowerDish.includes("lenteja")) {
          keywords = ["lenteja", "arroz", "cebolla", "aceite"]
        } else {
          keywords = ["verdura", "arroz", "cebolla"]
        }

        // Find items in this olla stock that match these keywords
        const activeStock = await tx.inventoryStock.findMany({
          where: { ollaId: data.ollaId },
          include: { supplyItem: true },
        })

        for (const kw of keywords) {
          const match = activeStock.find((s) => s.supplyItem.name.toLowerCase().includes(kw))
          if (match) {
            // Deduct a generic 0.1 units per serving (e.g. 10 kg for 100 servings)
            itemsToDiscount.push({
              supplyItemId: match.supplyItemId,
              quantity: 0.1 * data.servings,
            })
          }
        }
      }

      // Perform the stock deductions and insert inventory movements
      for (const item of itemsToDiscount) {
        // Create out movement
        await tx.inventoryMovement.create({
          data: {
            tenantId: data.tenantId,
            ollaId: data.ollaId,
            supplyItemId: item.supplyItemId,
            movementType: "out",
            quantity: item.quantity,
            notes: `Descuento automático por menú: ${data.dishName}`,
            createdBy: data.userId,
          },
        })

        // Update InventoryStock
        await tx.inventoryStock.upsert({
          where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: item.supplyItemId } },
          create: {
            ollaId: data.ollaId,
            supplyItemId: item.supplyItemId,
            quantity: -item.quantity,
            updatedAt: new Date(),
          },
          update: {
            quantity: { decrement: item.quantity },
            updatedAt: new Date(),
          },
        })

        // Check if stock became negative and insert alert
        const updatedStock = await tx.inventoryStock.findUnique({
          where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: item.supplyItemId } },
          include: { supplyItem: true },
        })

        if (updatedStock && Number(updatedStock.quantity) < 0) {
          await tx.alert.create({
            data: {
              tenantId: data.tenantId,
              ollaId: data.ollaId,
              alertType: "low_stock",
              severity: "high",
              message: `Stock en negativo para: ${updatedStock.supplyItem.name} — actual: ${Number(updatedStock.quantity)} ${updatedStock.supplyItem.unit}`,
              status: "open",
            },
          })
        }
      }

      return menuPlan
    })
  }
}

export const mobileRepository = new MobileRepository()
