import fs from "node:fs"
import path from "node:path"
import { prisma } from "../../lib/prisma"
import { supabase } from "../../lib/supabase"
import { mobileRepository } from "./repository"
import { calcularRequerimientos } from "./preparacion"

function errorHttp(statusCode: number, mensaje: string) {
  return Object.assign(new Error(mensaje), { statusCode })
}

export async function getDashboard(tenantId: string) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) {
    return {
      olla: null,
      summary: { planificadas: 0, entregadas: 0 },
      expiring: [],
    }
  }

  const [summary, expiring] = await Promise.all([
    mobileRepository.getDailySummary(olla.id),
    mobileRepository.getExpiringItems(olla.id),
  ])

  return { olla, summary, expiring }
}

export async function getInventory(tenantId: string) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) return { items: [], categories: [] }

  const [items, categories] = await Promise.all([
    mobileRepository.getInventory(olla.id),
    mobileRepository.getSupplyCategories(),
  ])

  return { items, categories }
}

export async function createMovement(tenantId: string, userId: string, payload: unknown) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) {
    throw Object.assign(new Error("No hay una olla activa para tu organización."), { statusCode: 404 })
  }

  const data = payload as Record<string, unknown>
  if (!data.supplyItemId || !data.movementType || !data.quantity) {
    throw Object.assign(new Error("Faltan campos obligatorios: supplyItemId, movementType, quantity."), {
      statusCode: 400,
    })
  }

  const quantity = Number(data.quantity)
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw Object.assign(new Error("La cantidad debe ser un número positivo."), { statusCode: 400 })
  }

  const validTypes = ["in", "out", "adjustment", "waste"]
  if (!validTypes.includes(data.movementType as string)) {
    throw Object.assign(new Error("Tipo de movimiento inválido."), { statusCode: 400 })
  }

  const movement = await mobileRepository.createMovement({
    tenantId,
    ollaId: olla.id,
    supplyItemId: data.supplyItemId as string,
    movementType: data.movementType as string,
    quantity,
    notes: (data.notes as string) ?? undefined,
    createdBy: userId,
  })

  return movement
}

export async function getAlerts(tenantId: string) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) return { items: [] }

  const alerts = await mobileRepository.getAlerts(olla.id)
  return {
    items: alerts.map((a) => ({
      id: a.id,
      tipo: mapAlertType(a.alertType),
      titulo: a.message.split("—")[0]?.trim() ?? a.message,
      descripcion: a.message,
      fecha: formatRelativeDate(a.detectedAt),
    })),
  }
}

export async function getSuggestions(tenantId: string) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) return { items: [] }

  const suggestions = await mobileRepository.getSuggestions(tenantId, olla.id)
  return {
    items: suggestions.map((s, i) => ({
      id: String(i + 1),
      nombre: s.nombre,
      puntaje: s.puntaje,
      ingredientes: s.ingredientes,
      recipeIngredients: s.recipeIngredients,
    })),
  }
}

function mapAlertType(type: string): string {
  const map: Record<string, string> = {
    low_stock: "bajo_stock",
    unusual_consumption: "general",
    missing_daily_report: "sincronizacion",
    high_priority_beneficiary: "general",
  }
  return map[type] ?? "general"
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "Ahora"
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  return date.toLocaleDateString("es-PE", { day: "numeric", month: "short" })
}

export async function registerMealDelivery(tenantId: string, userId: string, payload: unknown) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) {
    throw Object.assign(new Error("No hay una olla activa para tu organización."), { statusCode: 404 })
  }

  const data = payload as Record<string, unknown>
  const beneficiaryIds = Array.isArray(data.beneficiaryIds) ? (data.beneficiaryIds as string[]) : []
  const totalRations = Number(data.totalRations) || beneficiaryIds.length
  const dishName = (data.dishName as string) ?? undefined

  if (totalRations <= 0) {
    throw Object.assign(new Error("La cantidad de raciones debe ser mayor a 0."), { statusCode: 400 })
  }

  const delivery = await mobileRepository.createMealDelivery({
    tenantId,
    ollaId: olla.id,
    userId,
    beneficiaryIds,
    totalRations,
    dishName,
  })

  return delivery
}

export async function runMenuPlanExecution(tenantId: string, userId: string, payload: unknown) {
  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) {
    throw Object.assign(new Error("No hay una olla activa para tu organización."), { statusCode: 404 })
  }

  const data = payload as Record<string, unknown>
  if (!data.dishName) {
    throw Object.assign(new Error("El nombre del plato es obligatorio."), { statusCode: 400 })
  }

  const servings = Number(data.servings)
  if (Number.isNaN(servings) || servings <= 0) {
    throw Object.assign(new Error("La cantidad de raciones debe ser un número positivo."), { statusCode: 400 })
  }

  const recipeId = (data.recipeId as string) ?? undefined
  const recipeIngredients = (data.recipeIngredients as { supplyItemId: string; quantity: number }[]) ?? undefined

  const plan = await mobileRepository.executeMenuPlan({
    tenantId,
    ollaId: olla.id,
    userId,
    recipeId,
    dishName: data.dishName as string,
    servings,
    recipeIngredients,
  })

  return plan
}

export async function uploadDocument(tenantId: string, userId: string, payload: unknown) {
  const data = payload as {
    fileName: string
    fileType: string
    documentType: string
    title: string
    description?: string
    base64Data: string
  }

  if (!data.fileName || !data.base64Data || !data.documentType || !data.title) {
    throw Object.assign(new Error("Faltan campos obligatorios: fileName, base64Data, documentType, title."), {
      statusCode: 400,
    })
  }

  const olla = await mobileRepository.getUserOlla(tenantId)
  const ollaId = olla?.id || null

  const base64Clean = data.base64Data.replace(/^data:image\/\w+;base64,/, "")
  const fileBuffer = Buffer.from(base64Clean, "base64")

  const uniqueFileName = `${Date.now()}-${data.fileName}`
  let fileUrl = ""

  if (supabase) {
    try {
      const { data: uploadData, error } = await supabase.storage
        .from("evidences")
        .upload(`${tenantId}/${uniqueFileName}`, fileBuffer, {
          contentType: data.fileType || "image/jpeg",
          upsert: true,
        })

      if (!error && uploadData) {
        const { data: urlData } = supabase.storage
          .from("evidences")
          .getPublicUrl(`${tenantId}/${uniqueFileName}`)
        
        fileUrl = urlData?.publicUrl || ""
      }
    } catch (e) {
      console.warn("[supabase storage] Failed upload, falling back to local files:", e)
    }
  }

  if (!fileUrl) {
    const uploadDir = path.join(__dirname, "../../../../../frontend/public/uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const localFilePath = path.join(uploadDir, uniqueFileName)
    fs.writeFileSync(localFilePath, fileBuffer)
    fileUrl = `http://localhost:3000/uploads/${uniqueFileName}`
  }

  const doc = await prisma.document.create({
    data: {
      tenantId,
      ollaId,
      uploadedBy: userId,
      documentType: data.documentType,
      title: data.title,
      fileUrl,
      description: data.description || null,
    },
  })

  return doc
}

export async function getRecipes(tenantId: string) {
  const items = await mobileRepository.listRecipes(tenantId)
  return { items }
}

export async function calcularPreparacion(tenantId: string, payload: unknown) {
  const data = (payload ?? {}) as Record<string, unknown>

  const recipeId = typeof data.recipeId === "string" ? data.recipeId.trim() : ""
  if (!recipeId) {
    throw errorHttp(400, "El campo recipeId es obligatorio.")
  }

  let personas: number | undefined
  let fuentePersonas: "manual" | "padron" = "manual"
  if (data.personas !== undefined && data.personas !== null) {
    const valor = Number(data.personas)
    if (!Number.isInteger(valor) || valor <= 0) {
      throw errorHttp(400, "El campo personas debe ser un entero positivo.")
    }
    personas = valor
  }

  const olla = await mobileRepository.getUserOlla(tenantId)
  if (!olla) {
    throw errorHttp(404, "No hay una olla activa para tu organización.")
  }

  const receta = await mobileRepository.getRecipeWithIngredients(recipeId, tenantId)
  if (!receta) {
    throw errorHttp(404, "Receta no encontrada.")
  }
  if (receta.ingredientes.length === 0) {
    throw errorHttp(422, "La receta no tiene ingredientes para calcular.")
  }

  if (personas === undefined) {
    const activos = await mobileRepository.countActiveBeneficiaries(olla.id)
    personas = activos > 0 ? activos : receta.racionesEstimadas
    fuentePersonas = "padron"
  }

  const stockPorItem = await mobileRepository.getStockMap(olla.id)
  const calculo = calcularRequerimientos({
    racionesEstimadas: receta.racionesEstimadas,
    ingredientes: receta.ingredientes,
    stockPorItem,
    personas,
  })

  return {
    olla: { id: olla.id, name: olla.name },
    receta: { id: receta.id, nombre: receta.nombre, racionesEstimadas: receta.racionesEstimadas },
    personas,
    fuentePersonas,
    racionesPosiblesConStock: calculo.racionesPosiblesConStock,
    alcanzaParaTodos: calculo.alcanzaParaTodos,
    ingredientes: calculo.ingredientes,
    resumen: {
      totalIngredientes: calculo.ingredientes.length,
      ingredientesFaltantes: calculo.ingredientes.filter((i) => !i.alcanza).length,
    },
  }
}
