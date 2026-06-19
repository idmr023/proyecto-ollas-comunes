// Lógica pura de la calculadora de preparación. No accede a la base de datos:
// recibe los datos ya cargados para poder probarse de forma aislada.

export interface IngredienteReceta {
  supplyItemId: string
  nombre: string
  unidad: string
  cantidad: number
}

export interface IngredienteCalculado {
  supplyItemId: string
  nombre: string
  unidad: string
  consumoPorRacion: number
  necesario: number
  stockActual: number
  faltante: number
  alcanza: boolean
}

export interface ResultadoPreparacion {
  ingredientes: IngredienteCalculado[]
  racionesPosiblesConStock: number
  alcanzaParaTodos: boolean
}

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Calcula los requerimientos de ingredientes para atender a `personas` según la
 * receta, comparando contra el stock disponible. Determinista, sin efectos.
 */
export function calcularRequerimientos(params: {
  racionesEstimadas: number
  ingredientes: IngredienteReceta[]
  stockPorItem: Map<string, number>
  personas: number
}): ResultadoPreparacion {
  const base = params.racionesEstimadas > 0 ? params.racionesEstimadas : 1
  let racionesPosibles = Number.POSITIVE_INFINITY

  const ingredientes = params.ingredientes.map((ing): IngredienteCalculado => {
    const consumoPorRacion = ing.cantidad / base
    const necesario = redondear2(consumoPorRacion * params.personas)
    const stockActual = params.stockPorItem.get(ing.supplyItemId) ?? 0
    const faltante = redondear2(Math.max(0, necesario - stockActual))
    if (consumoPorRacion > 0) {
      racionesPosibles = Math.min(racionesPosibles, Math.floor(stockActual / consumoPorRacion))
    }
    return {
      supplyItemId: ing.supplyItemId,
      nombre: ing.nombre,
      unidad: ing.unidad,
      consumoPorRacion: redondear2(consumoPorRacion),
      necesario,
      stockActual: redondear2(stockActual),
      faltante,
      alcanza: stockActual >= necesario,
    }
  })

  return {
    ingredientes,
    racionesPosiblesConStock: Number.isFinite(racionesPosibles) ? Math.max(0, racionesPosibles) : 0,
    alcanzaParaTodos: ingredientes.every((i) => i.alcanza),
  }
}
