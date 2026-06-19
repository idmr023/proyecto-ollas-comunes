// Lógica pura del pronóstico de demanda. Sin acceso a BD ni a la IA:
// estima cuántas personas atender según el historial reciente de raciones.

export interface PronosticoDemanda {
  personas: number
  basadoEn: string
}

/**
 * Promedia las raciones entregadas en los días recientes para estimar la
 * demanda. La IA puede ajustar/explicar este número, pero la base es determinista
 * para que el sistema funcione aunque la IA falle.
 *
 * @param racionesPorDia raciones totales entregadas en cada día reciente
 * @param fallbackBeneficiarios conteo del padrón, usado si no hay historial
 */
export function calcularPronosticoDemanda(
  racionesPorDia: number[],
  fallbackBeneficiarios: number,
): PronosticoDemanda {
  const validas = racionesPorDia.filter((n) => Number.isFinite(n) && n > 0)
  if (validas.length === 0) {
    return { personas: Math.max(0, Math.round(fallbackBeneficiarios)), basadoEn: 'padron' }
  }
  const suma = validas.reduce((acc, n) => acc + n, 0)
  const promedio = Math.round(suma / validas.length)
  return { personas: Math.max(0, promedio), basadoEn: `promedio de ${validas.length} día(s) con entregas` }
}
