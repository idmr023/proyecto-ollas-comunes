import { describe, it, expect } from 'vitest'
import { calcularRequerimientos, IngredienteReceta } from '../modules/mobile/preparacion'

const ingredientes: IngredienteReceta[] = [
  { supplyItemId: 'lentejas', nombre: 'Lentejas', unidad: 'kg', cantidad: 4 },
  { supplyItemId: 'aceite', nombre: 'Aceite vegetal', unidad: 'L', cantidad: 1 },
]

describe('calcularRequerimientos', () => {
  it('marca que alcanza cuando hay stock suficiente en todos', () => {
    const stockSuficiente = new Map<string, number>([['lentejas', 50], ['aceite', 20]])
    const actual = calcularRequerimientos({
      racionesEstimadas: 50,
      ingredientes,
      stockPorItem: stockSuficiente,
      personas: 50,
    })
    expect(actual.alcanzaParaTodos).toBe(true)
    expect(actual.ingredientes.every((i) => i.faltante === 0)).toBe(true)
  })

  it('reporta el faltante y las raciones posibles cuando un ingrediente no alcanza', () => {
    const stockJusto = new Map<string, number>([['lentejas', 50], ['aceite', 2]])
    const actual = calcularRequerimientos({
      racionesEstimadas: 50,
      ingredientes,
      stockPorItem: stockJusto,
      personas: 180,
    })
    const aceite = actual.ingredientes.find((i) => i.supplyItemId === 'aceite')!
    expect(aceite.necesario).toBe(3.6)
    expect(aceite.faltante).toBe(1.6)
    expect(actual.alcanzaParaTodos).toBe(false)
    expect(actual.racionesPosiblesConStock).toBe(100)
  })

  it('trata un ingrediente sin stock como faltante completo', () => {
    const sinAceite = new Map<string, number>([['lentejas', 50]])
    const actual = calcularRequerimientos({
      racionesEstimadas: 50,
      ingredientes,
      stockPorItem: sinAceite,
      personas: 50,
    })
    const aceite = actual.ingredientes.find((i) => i.supplyItemId === 'aceite')!
    expect(aceite.stockActual).toBe(0)
    expect(aceite.necesario).toBe(1)
    expect(aceite.faltante).toBe(1)
    expect(actual.racionesPosiblesConStock).toBe(0)
  })

  it('no divide por cero cuando racionesEstimadas es 0', () => {
    const actual = calcularRequerimientos({
      racionesEstimadas: 0,
      ingredientes,
      stockPorItem: new Map<string, number>([['lentejas', 4], ['aceite', 1]]),
      personas: 1,
    })
    expect(actual.ingredientes[0].consumoPorRacion).toBe(4)
    expect(actual.ingredientes[0].necesario).toBe(4)
  })
})
