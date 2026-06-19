import { describe, it, expect } from 'vitest'
import { calcularPronosticoDemanda } from '../jobs/pronostico'

describe('calcularPronosticoDemanda', () => {
  it('promedia las raciones de los días con entregas', () => {
    const actual = calcularPronosticoDemanda([180, 160, 200], 50)
    expect(actual.personas).toBe(180)
    expect(actual.basadoEn).toContain('3 día')
  })

  it('ignora días sin entregas (cero o negativos)', () => {
    const actual = calcularPronosticoDemanda([0, 100, 0, 200], 50)
    expect(actual.personas).toBe(150)
    expect(actual.basadoEn).toContain('2 día')
  })

  it('cae al conteo del padrón cuando no hay historial', () => {
    const actual = calcularPronosticoDemanda([], 142)
    expect(actual.personas).toBe(142)
    expect(actual.basadoEn).toBe('padron')
  })
})
