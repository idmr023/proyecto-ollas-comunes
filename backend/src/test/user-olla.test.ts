import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    appUser: { findUnique: vi.fn() },
    ollaComun: { findFirst: vi.fn() },
  },
}))

import { prisma } from '../lib/prisma'
import { mobileRepository } from '../modules/mobile/repository'

const appUserFindUnique = vi.mocked(prisma.appUser.findUnique)
const ollaFindFirst = vi.mocked(prisma.ollaComun.findFirst)

const TENANT_A = '11111111-1111-4111-8111-111111111111'
const OLLA_ASIGNADA = '22222222-2222-4222-8222-222222222222'
const USER_ID = '33333333-3333-4333-8333-333333333333'

const ollaRecord = { id: OLLA_ASIGNADA, name: 'Olla Zapallal', code: 'Z1', address: 'x' }

beforeEach(() => {
  vi.resetAllMocks()
})

/**
 * Antes esta funcion recibia `tenantId` y devolvia la primera olla activa de la
 * organizacion por orden alfabetico, la misma para todas sus lideresas.
 */
describe('getUserOlla', () => {
  it('devuelve la olla asignada al usuario', async () => {
    appUserFindUnique.mockResolvedValue({
      ollaId: OLLA_ASIGNADA,
      tenantId: TENANT_A,
      role: 'lideresa_olla',
    } as never)
    ollaFindFirst.mockResolvedValue(ollaRecord as never)

    const olla = await mobileRepository.getUserOlla(USER_ID)

    expect(olla?.id).toBe(OLLA_ASIGNADA)
    // La resolucion parte del usuario, no de la organizacion.
    expect(appUserFindUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { ollaId: true, tenantId: true, role: true },
    })
  })

  it('exige que la olla asignada siga activa y dentro de su organizacion', async () => {
    appUserFindUnique.mockResolvedValue({
      ollaId: OLLA_ASIGNADA,
      tenantId: TENANT_A,
      role: 'lideresa_olla',
    } as never)
    ollaFindFirst.mockResolvedValue(ollaRecord as never)

    await mobileRepository.getUserOlla(USER_ID)

    expect(ollaFindFirst).toHaveBeenCalledWith({
      where: { id: OLLA_ASIGNADA, tenantId: TENANT_A, status: 'active' },
      select: { id: true, name: true, code: true, address: true },
    })
  })

  it('NO cae en la primera olla del tenant para una lideresa sin asignar', async () => {
    appUserFindUnique.mockResolvedValue({
      ollaId: null,
      tenantId: TENANT_A,
      role: 'lideresa_olla',
    } as never)

    // Fail-closed: devolver una olla cualquiera es el fallo que se corrige.
    expect(await mobileRepository.getUserOlla(USER_ID)).toBeNull()
    expect(ollaFindFirst).not.toHaveBeenCalled()
  })

  it('permite a un rol administrativo operar sin olla asignada', async () => {
    appUserFindUnique.mockResolvedValue({
      ollaId: null,
      tenantId: TENANT_A,
      role: 'admin_municipal',
    } as never)
    ollaFindFirst.mockResolvedValue(ollaRecord as never)

    const olla = await mobileRepository.getUserOlla(USER_ID)

    expect(olla?.id).toBe(OLLA_ASIGNADA)
    expect(ollaFindFirst).toHaveBeenCalledWith({
      where: { tenantId: TENANT_A, status: 'active' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, address: true },
    })
  })

  it('devuelve null cuando el usuario no existe', async () => {
    appUserFindUnique.mockResolvedValue(null as never)
    expect(await mobileRepository.getUserOlla(USER_ID)).toBeNull()
  })
})
