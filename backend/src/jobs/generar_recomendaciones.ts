import { getPeruDayRange } from "../lib/date-utils"
import { mobileRepository } from "../modules/mobile/repository"
import { calcularPronosticoDemanda } from "./pronostico"

export const TIPO_MENU_SUGERIDO = "menu_sugerido"
export const TIPO_PRONOSTICO_DEMANDA = "pronostico_demanda"

const DIAS_HISTORIAL = 14

interface ResumenJob {
  ollasProcesadas: number
  ollasConError: number
}

function fechaObjetivoYExpiracion(): { targetDate: Date; expiresAt: Date } {
  const { end, dateString } = getPeruDayRange()
  return { targetDate: new Date(`${dateString}T00:00:00.000Z`), expiresAt: end }
}

/**
 * Genera y cachea las recomendaciones de IA de una olla para el día de hoy.
 * Aísla los fallos: si algo falla, no rompe el procesamiento de las demás ollas.
 */
export async function generarRecomendacionesPorOlla(tenantId: string, ollaId: string): Promise<void> {
  const { targetDate, expiresAt } = fechaObjetivoYExpiracion()

  // 1. Menú sugerido (reutiliza la lógica con Gemini y su fallback)
  const sugerencias = await mobileRepository.getSuggestions(tenantId, ollaId)
  await mobileRepository.upsertRecomendacion({
    tenantId,
    ollaId,
    recommendationType: TIPO_MENU_SUGERIDO,
    targetDate,
    title: "Menú sugerido del día",
    description: sugerencias[0]?.nombre,
    payload: { platos: sugerencias },
    expiresAt,
  })

  // 2. Pronóstico de demanda (heurístico, ajustable por la IA después)
  const [racionesPorDia, beneficiarios] = await Promise.all([
    mobileRepository.getRecentDailyRations(ollaId, DIAS_HISTORIAL),
    mobileRepository.countActiveBeneficiaries(ollaId),
  ])
  const pronostico = calcularPronosticoDemanda(racionesPorDia, beneficiarios)
  await mobileRepository.upsertRecomendacion({
    tenantId,
    ollaId,
    recommendationType: TIPO_PRONOSTICO_DEMANDA,
    targetDate,
    title: "Pronóstico de personas a atender",
    description: `${pronostico.personas} personas (${pronostico.basadoEn})`,
    payload: pronostico,
    expiresAt,
  })
}

/**
 * Procesa todas las ollas activas. Pensado para ejecutarse desde un cron diario.
 */
export async function generarRecomendaciones(): Promise<ResumenJob> {
  const ollas = await mobileRepository.listActiveOllas()
  let ollasConError = 0

  for (const olla of ollas) {
    try {
      await generarRecomendacionesPorOlla(olla.tenantId, olla.id)
    } catch (error) {
      ollasConError++
      console.error(`[job:recomendaciones] Falló la olla ${olla.id}:`, error)
    }
  }

  return { ollasProcesadas: ollas.length - ollasConError, ollasConError }
}
