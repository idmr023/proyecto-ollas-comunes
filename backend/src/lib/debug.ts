/**
 * Exponer trazas internas depende de un flag explicito, no de la ausencia de
 * `NODE_ENV=production`.
 *
 * El patron anterior (`NODE_ENV !== 'production'`) falla peligrosamente abierto:
 * si la variable se pierde en el despliegue, la API empieza a devolver detalles
 * internos sin que nadie lo note.
 */
export const isDebugEnabled = process.env.EXPOSE_ERROR_DETAILS === 'true'

/** Detalle del error solo cuando la depuracion esta activada de forma explicita. */
export function debugDetail(error: unknown): { detail: string } | Record<string, never> {
  return isDebugEnabled ? { detail: String(error) } : {}
}
