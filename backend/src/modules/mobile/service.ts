import { mobileRepository } from "./repository"

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
