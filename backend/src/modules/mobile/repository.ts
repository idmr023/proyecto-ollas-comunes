import { prisma } from "../../lib/prisma"
import { getPeruDayRange } from "../../lib/date-utils"

export class MobileRepository {
  async getUserOlla(tenantId: string) {
    return prisma.ollaComun.findFirst({
      where: { tenantId, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, address: true },
    })
  }

  async getDailySummary(ollaId: string) {
    const { dateString } = getPeruDayRange()

    const menuPlan = await prisma.menuPlan.findFirst({
      where: {
        ollaId,
        operationDate: new Date(dateString),
        status: { in: ["draft", "approved", "executed"] },
      },
      select: {
        id: true,
        dishName: true,
        status: true,
        plannedServings: true,
        recipe: {
          select: {
            id: true,
            name: true,
            estimatedServings: true,
            ingredients: {
              select: {
                supplyItemId: true,
                quantity: true,
                supplyItem: {
                  select: { name: true }
                }
              }
            }
          }
        },
        deliveries: { select: { totalRations: true } },
      },
    })

    if (!menuPlan) return { planificadas: 0, entregadas: 0, menu: null }

    const entregadas = menuPlan.deliveries.reduce((sum, d) => sum + d.totalRations, 0)

    // Calculate maximum servings possible based on available stock of the recipe ingredients
    let maxServings = 9999 // fallback / high limit

    // Find the current inventory stock for this olla
    const activeStock = await prisma.inventoryStock.findMany({
      where: { ollaId },
    })

    if (menuPlan.recipe && menuPlan.recipe.ingredients.length > 0) {
      const estServings = menuPlan.recipe.estimatedServings || 1
      for (const ing of menuPlan.recipe.ingredients) {
        const stockItem = activeStock.find(s => s.supplyItemId === ing.supplyItemId)
        const stockQty = stockItem ? Number(stockItem.quantity) : 0
        const consumptionPerServing = Number(ing.quantity) / estServings
        if (consumptionPerServing > 0) {
          const possibleServings = Math.floor(stockQty / consumptionPerServing)
          if (possibleServings < maxServings) {
            maxServings = possibleServings
          }
        }
      }
    } else {
      // Fallback keywords based limit
      const lowerDish = (menuPlan.dishName || "").toLowerCase()
      let keywords: string[] = []
      if (lowerDish.includes("pollo")) {
        keywords = ["arroz", "pollo", "zanahoria", "papa"]
      } else if (lowerDish.includes("lenteja")) {
        keywords = ["lenteja", "arroz", "cebolla", "aceite"]
      } else {
        keywords = ["verdura", "arroz", "cebolla"]
      }

      // Fetch active stock with supply items to match names
      const activeStockWithItems = await prisma.inventoryStock.findMany({
        where: { ollaId },
        include: { supplyItem: true }
      })

      for (const kw of keywords) {
        const match = activeStockWithItems.find((s) => s.supplyItem.name.toLowerCase().includes(kw))
        const stockQty = match ? Number(match.quantity) : 0
        // Fallback uses 0.1 units per serving
        const possibleServings = Math.floor(stockQty / 0.1)
        if (possibleServings < maxServings) {
          maxServings = possibleServings
        }
      }
    }

    const maxServingsRemaining = Math.max(0, maxServings)

    return {
      planificadas: menuPlan.plannedServings,
      entregadas,
      menu: {
        id: menuPlan.id,
        dishName: menuPlan.dishName,
        status: menuPlan.status,
        maxServingsRemaining,
        recipe: menuPlan.recipe ? {
          name: menuPlan.recipe.name,
          ingredients: menuPlan.recipe.ingredients.map(i => i.supplyItem.name)
        } : null
      }
    }
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
      const currentStock = await tx.inventoryStock.findUnique({
        where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: data.supplyItemId } },
      })

      const currentQty = currentStock ? Number(currentStock.quantity) : 0
      const stockDelta = data.movementType === "in" ? data.quantity : -data.quantity
      const newQty = Math.max(0, currentQty + stockDelta)

      await tx.inventoryStock.upsert({
        where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: data.supplyItemId } },
        create: { ollaId: data.ollaId, supplyItemId: data.supplyItemId, quantity: Math.max(0, stockDelta) },
        update: { quantity: newQty, updatedAt: new Date() },
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
    // 1. Get all available inventory stock
    const activeStock = await prisma.inventoryStock.findMany({
      where: { ollaId, quantity: { gt: 0 } },
      include: {
        supplyItem: {
          select: { id: true, name: true, unit: true, isPerishable: true }
        }
      }
    })

    const stockSummary = activeStock.map(s => ({
      supplyItemId: s.supplyItemId,
      name: s.supplyItem.name,
      qty: Number(s.quantity),
      unit: s.supplyItem.unit,
      isPerishable: s.supplyItem.isPerishable
    }))

    // 2. Get active beneficiaries count, demographics, and health conditions
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { tenantId, status: "active", ollaId },
      include: {
        healthConditions: {
          include: { healthCondition: true }
        }
      }
    })

    const totalBeneficiaries = beneficiaries.length || 50 // fallback if none yet
    
    // Demographics count by birth date
    let children = 0
    let adults = 0
    let elderly = 0
    
    const today = new Date()
    for (const b of beneficiaries) {
      const birth = new Date(b.birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      if (age < 12) {
        children++
      } else if (age >= 60) {
        elderly++
      } else {
        adults++
      }
    }

    // Health conditions aggregate count
    const conditionsMap: Record<string, number> = {}
    for (const b of beneficiaries) {
      for (const hc of b.healthConditions) {
        const name = hc.healthCondition.name
        conditionsMap[name] = (conditionsMap[name] || 0) + 1
      }
    }

    const olla = await prisma.ollaComun.findUnique({
      where: { id: ollaId },
      include: { district: true }
    })

    const locationContext = {
      district: olla?.district?.name || "Lima",
      address: olla?.address || ""
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === "") {
      // Return a structured warning fallback suggestion so the application doesn't crash if apiKey is not configured yet
      return [
        {
          nombre: "Configurar API Key de Gemini (Offline)",
          puntaje: 99,
          ingredientes: ["Por favor, agregue su clave GEMINI_API_KEY en el archivo backend/.env para activar la generación inteligente."],
          recipeIngredients: []
        }
      ]
    }

    const prompt = `
Eres un nutricionista experto en gestión de ollas comunes en el Perú. Tu objetivo es sugerir sugerencias de platos de comida realistas, económicos, nutritivos y acordes al contexto peruano.

Datos de la Olla Común:
- Ubicación: ${locationContext.district}, ${locationContext.address}
- Beneficiarios totales: ${totalBeneficiaries}
- Grupos de edad: Niños (<12 años): ${children}, Adultos (12-59 años): ${adults}, Adulto Mayor (60+ años): ${elderly}
- Condiciones de salud en la población: ${JSON.stringify(conditionsMap)}

Insumos reales disponibles en el inventario de la olla:
${JSON.stringify(stockSummary)}

Instrucciones:
1. Sugiere 2 opciones de platos peruanos tradicionales (ej. seco de pollo, guiso de lentejas, sopa de verduras, tacu tacu, chanfainita, estofado, etc.) que se puedan preparar usando preferentemente los insumos del almacén.
2. Cada plato debe contener un puntaje de idoneidad nutritional (escala 1-100) basándose en las necesidades del padrón.
3. Para cada plato sugerido, debes especificar exactamente qué insumos de los provistos en la lista de inventario utilizará y en qué cantidad (en la misma unidad de medida que figura en el inventario) para preparar raciones para ${totalBeneficiaries} personas.
4. SOLO utiliza ingredientes que existan en el inventario provisto (usa sus supplyItemId). No sugieras insumos inexistentes.
5. Devuelve la información estrictamente estructurada según el JSON schema requerido.
`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  suggestions: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        nombre: { "type": "STRING" },
                        puntaje: { "type": "INTEGER" },
                        justification: { "type": "STRING" },
                        ingredientsNeeded: {
                          type: "ARRAY",
                          items: {
                            type: "OBJECT",
                            properties: {
                              supplyItemId: { "type": "STRING" },
                              quantityNeeded: { "type": "NUMBER" }
                            },
                            required: ["supplyItemId", "quantityNeeded"]
                          }
                        }
                      },
                      required: ["nombre", "puntaje", "justification", "ingredientsNeeded"]
                    }
                  }
                },
                required: ["suggestions"]
              }
            }
          })
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        console.error("Gemini API error status:", response.status, errText)
        throw new Error(`Error en API de Gemini: ${response.statusText}`)
      }

      const resData = await response.json() as any
      const textContent = resData.candidates?.[0]?.content?.parts?.[0]?.text
      if (!textContent) {
        throw new Error("No se obtuvo respuesta de Gemini")
      }

      const parsed = JSON.parse(textContent) as {
        suggestions: {
          nombre: string
          puntaje: number
          justification: string
          ingredientsNeeded: { supplyItemId: string; quantityNeeded: number }[]
        }[]
      }

      return parsed.suggestions.map((s) => {
        const displayIngredients = s.ingredientsNeeded.map((ing) => {
          const item = stockSummary.find((st) => st.supplyItemId === ing.supplyItemId)
          return `${item ? item.name : "Insumo"} (${ing.quantityNeeded} ${item ? item.unit : "un"})`
        })

        return {
          nombre: s.nombre,
          puntaje: s.puntaje,
          ingredientes: displayIngredients,
          recipeIngredients: s.ingredientsNeeded.map(ing => ({
            supplyItemId: ing.supplyItemId,
            quantity: ing.quantityNeeded
          }))
        }
      })
    } catch (error) {
      console.error("Error generating Gemini suggestions, falling back...", error)
      return [
        {
          nombre: "Seco de Pollo con Arroz (Offline)",
          puntaje: 85,
          ingredientes: ["Arroz (5 kg)", "Pollo (5 kg)", "Zanahoria (1 kg)"],
          recipeIngredients: []
        }
      ]
    }
  }

  async createMealDelivery(data: {
    tenantId: string
    ollaId: string
    userId: string
    beneficiaryIds: string[]
    totalRations: number
    dishName?: string
  }) {
    const { dateString } = getPeruDayRange()
    const operationDate = new Date(dateString)

    return prisma.$transaction(async (tx) => {
      // 1. Get today's MenuPlan
      let menuPlan = await tx.menuPlan.findFirst({
        where: {
          ollaId: data.ollaId,
          operationDate,
        },
        include: {
          recipe: {
            include: {
              ingredients: true
            }
          }
        }
      })

      if (!menuPlan) {
        menuPlan = await tx.menuPlan.create({
          data: {
            ollaId: data.ollaId,
            operationDate,
            dishName: data.dishName || "Almuerzo del día",
            plannedServings: data.totalRations || data.beneficiaryIds.length,
            status: "executed",
            suggestedByType: "user",
            createdBy: data.userId,
          },
          include: {
            recipe: {
              include: {
                ingredients: true
              }
            }
          }
        })
      } else {
        menuPlan = await tx.menuPlan.update({
          where: { id: menuPlan.id },
          data: { status: "executed" },
          include: {
            recipe: {
              include: {
                ingredients: true
              }
            }
          }
        })
      }

      // 2. Determine items to discount based on servings (data.totalRations)
      const servings = data.totalRations || data.beneficiaryIds.length
      const itemsToDiscount: { supplyItemId: string; quantity: number }[] = []

      if (menuPlan.recipe && menuPlan.recipe.ingredients.length > 0) {
        const factor = servings / (menuPlan.recipe.estimatedServings || 1)
        for (const ing of menuPlan.recipe.ingredients) {
          const qty = Number((Number(ing.quantity) * factor).toFixed(2))
          if (qty >= 0.01) {
            itemsToDiscount.push({
              supplyItemId: ing.supplyItemId,
              quantity: qty,
            })
          }
        }
      } else {
        // Fallback: match keywords by name
        const lowerDish = (menuPlan.dishName || data.dishName || "Almuerzo del día").toLowerCase()
        let keywords: string[] = []
        if (lowerDish.includes("pollo")) {
          keywords = ["arroz", "pollo", "zanahoria", "papa"]
        } else if (lowerDish.includes("lenteja")) {
          keywords = ["lenteja", "arroz", "cebolla", "aceite"]
        } else {
          keywords = ["verdura", "arroz", "cebolla"]
        }

        const activeStock = await tx.inventoryStock.findMany({
          where: { ollaId: data.ollaId },
          include: { supplyItem: true },
        })

        for (const kw of keywords) {
          const match = activeStock.find((s) => s.supplyItem.name.toLowerCase().includes(kw))
          if (match) {
            const qty = Number((0.1 * servings).toFixed(2))
            if (qty >= 0.01) {
              itemsToDiscount.push({
                supplyItemId: match.supplyItemId,
                quantity: qty,
              })
            }
          }
        }
      }

      // 3. Perform deductions and movements
      for (const item of itemsToDiscount) {
        await tx.inventoryMovement.create({
          data: {
            tenantId: data.tenantId,
            ollaId: data.ollaId,
            supplyItemId: item.supplyItemId,
            movementType: "out",
            quantity: item.quantity,
            notes: `Descuento incremental: ${menuPlan.dishName}`,
            createdBy: data.userId,
          },
        })

        const currentStock = await tx.inventoryStock.findUnique({
          where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: item.supplyItemId } },
          include: { supplyItem: true },
        })

        const currentQty = currentStock ? Number(currentStock.quantity) : 0
        const isInsufficient = currentQty < item.quantity
        const newQty = Math.max(0, currentQty - item.quantity)

        await tx.inventoryStock.upsert({
          where: { ollaId_supplyItemId: { ollaId: data.ollaId, supplyItemId: item.supplyItemId } },
          create: {
            ollaId: data.ollaId,
            supplyItemId: item.supplyItemId,
            quantity: 0,
            updatedAt: new Date(),
          },
          update: {
            quantity: newQty,
            updatedAt: new Date(),
          },
        })

        if (isInsufficient) {
          const supplyItem = currentStock?.supplyItem || await tx.supplyItem.findUnique({ where: { id: item.supplyItemId } })
          if (supplyItem) {
            await tx.alert.create({
              data: {
                tenantId: data.tenantId,
                ollaId: data.ollaId,
                alertType: "low_stock",
                severity: "high",
                message: `Stock insuficiente para: ${supplyItem.name} — Se intentó descontar ${item.quantity} ${supplyItem.unit} pero solo había ${currentQty} ${supplyItem.unit}`,
                status: "open",
              },
            })
          }
        }
      }

      // 4. Create MealDelivery
      const delivery = await tx.mealDelivery.create({
        data: {
          menuPlanId: menuPlan.id,
          totalRations: servings,
          createdBy: data.userId,
        },
      })

      // 5. Create MealDeliveryDetail for each beneficiary
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
    recipeIngredients?: { supplyItemId: string; quantity: number }[]
  }) {
    const { dateString } = getPeruDayRange()
    const operationDate = new Date(dateString)

    return prisma.$transaction(async (tx) => {
      // 1. Get or create today's MenuPlan
      let menuPlan = await tx.menuPlan.findFirst({
        where: {
          ollaId: data.ollaId,
          operationDate,
        },
      })

      let recipe = null
      if (data.recipeId) {
        recipe = await tx.recipe.findUnique({
          where: { id: data.recipeId },
          include: { ingredients: true },
        })
      } else if (data.recipeIngredients && data.recipeIngredients.length > 0) {
        // Find units for all selected items
        const supplyItemIds = data.recipeIngredients.map(ing => ing.supplyItemId)
        const supplyItems = await tx.supplyItem.findMany({
          where: { id: { in: supplyItemIds } },
          select: { id: true, unit: true }
        })

        // Create new dynamic recipe
        recipe = await tx.recipe.create({
          data: {
            tenantId: data.tenantId,
            name: `Menú IA: ${data.dishName} (${new Date().toLocaleDateString('es-PE')})`,
            description: `Receta dinámica sugerida por IA para la olla común`,
            estimatedServings: data.servings || 100,
            status: "active",
            ingredients: {
              create: data.recipeIngredients.map(ing => {
                const matchedItem = supplyItems.find(item => item.id === ing.supplyItemId)
                return {
                  supplyItemId: ing.supplyItemId,
                  quantity: ing.quantity,
                  unit: matchedItem?.unit || "un"
                }
              })
            }
          },
          include: { ingredients: true }
        })
      }

      if (!menuPlan) {
        menuPlan = await tx.menuPlan.create({
          data: {
            ollaId: data.ollaId,
            operationDate,
            dishName: data.dishName,
            plannedServings: data.servings,
            recipeId: recipe?.id || null,
            status: "approved",
            suggestedByType: recipe ? "user" : "ia",
            createdBy: data.userId,
          },
        })
      } else {
        menuPlan = await tx.menuPlan.update({
          where: { id: menuPlan.id },
          data: {
            status: "approved",
            dishName: data.dishName,
            recipeId: recipe?.id || menuPlan.recipeId,
          },
        })
      }

      return menuPlan
    })
  }

  async listRecipes(tenantId: string) {
    const recipes = await prisma.recipe.findMany({
      where: { tenantId, status: "active" },
      orderBy: { name: "asc" },
      include: { ingredients: { select: { supplyItemId: true } } },
    })
    return recipes.map((r) => ({
      id: r.id,
      nombre: r.name,
      racionesEstimadas: r.estimatedServings,
      totalIngredientes: r.ingredients.length,
    }))
  }

  async getRecipeWithIngredients(recipeId: string, tenantId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, tenantId },
      include: {
        ingredients: {
          include: { supplyItem: { select: { id: true, name: true, unit: true } } },
        },
      },
    })
    if (!recipe) return null
    return {
      id: recipe.id,
      nombre: recipe.name,
      racionesEstimadas: recipe.estimatedServings,
      ingredientes: recipe.ingredients.map((i) => ({
        supplyItemId: i.supplyItemId,
        nombre: i.supplyItem.name,
        unidad: i.supplyItem.unit,
        cantidad: Number(i.quantity),
      })),
    }
  }

  async getStockMap(ollaId: string) {
    const stock = await prisma.inventoryStock.findMany({ where: { ollaId } })
    const mapa = new Map<string, number>()
    for (const s of stock) {
      mapa.set(s.supplyItemId, Number(s.quantity))
    }
    return mapa
  }

  async countActiveBeneficiaries(ollaId: string) {
    return prisma.beneficiary.count({ where: { ollaId, status: "active" } })
  }

  async listActiveOllas() {
    return prisma.ollaComun.findMany({
      where: { status: "active" },
      select: { id: true, tenantId: true, name: true },
    })
  }

  async getRecentDailyRations(ollaId: string, days: number): Promise<number[]> {
    const desde = new Date()
    desde.setUTCDate(desde.getUTCDate() - days)
    const entregas = await prisma.mealDelivery.findMany({
      where: { menuPlan: { ollaId }, deliveredAt: { gte: desde } },
      select: { deliveredAt: true, totalRations: true },
    })
    const porDia = new Map<string, number>()
    for (const e of entregas) {
      const clave = e.deliveredAt.toISOString().slice(0, 10)
      porDia.set(clave, (porDia.get(clave) ?? 0) + e.totalRations)
    }
    return Array.from(porDia.values())
  }

  async getRecomendacionVigente(ollaId: string, recommendationType: string, targetDate: Date) {
    const reco = await prisma.recommendation.findUnique({
      where: { ollaId_recommendationType_targetDate: { ollaId, recommendationType, targetDate } },
    })
    if (!reco) return null
    if (reco.expiresAt && reco.expiresAt.getTime() < Date.now()) return null
    return reco
  }

  async upsertRecomendacion(data: {
    tenantId: string
    ollaId: string
    recommendationType: string
    targetDate: Date
    title: string
    description?: string
    payload: unknown
    expiresAt: Date
  }) {
    const valores = {
      title: data.title,
      description: data.description ?? null,
      payload: data.payload as object,
      expiresAt: data.expiresAt,
      generatedByType: "ia",
      status: "pending",
    }
    return prisma.recommendation.upsert({
      where: {
        ollaId_recommendationType_targetDate: {
          ollaId: data.ollaId,
          recommendationType: data.recommendationType,
          targetDate: data.targetDate,
        },
      },
      create: {
        tenantId: data.tenantId,
        ollaId: data.ollaId,
        recommendationType: data.recommendationType,
        targetDate: data.targetDate,
        ...valores,
      },
      update: valores,
    })
  }
}

export const mobileRepository = new MobileRepository()
