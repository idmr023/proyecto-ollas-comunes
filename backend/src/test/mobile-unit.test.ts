import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: null,
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    document: { create: vi.fn() },
  },
}))

vi.mock('../modules/mobile/repository', () => ({
  mobileRepository: {
    getUserOlla: vi.fn(),
    getDailySummary: vi.fn(),
    getExpiringItems: vi.fn(),
    getInventory: vi.fn(),
    getSupplyCategories: vi.fn(),
    createMovement: vi.fn(),
    getAlerts: vi.fn(),
    getSuggestions: vi.fn(),
    createMealDelivery: vi.fn(),
    executeMenuPlan: vi.fn(),
    uploadDocument: vi.fn(),
  },
}))

import { prisma } from '../lib/prisma'
import { mobileRepository } from '../modules/mobile/repository'
import {
  getDashboard,
  getInventory,
  createMovement,
  getAlerts,
  getSuggestions,
  registerMealDelivery,
  runMenuPlanExecution,
} from '../modules/mobile/service'
import { mobileRouter } from '../modules/mobile/router'

const repo = mobileRepository as unknown as {
  getUserOlla: ReturnType<typeof vi.fn>
  getDailySummary: ReturnType<typeof vi.fn>
  getExpiringItems: ReturnType<typeof vi.fn>
  getInventory: ReturnType<typeof vi.fn>
  getSupplyCategories: ReturnType<typeof vi.fn>
  createMovement: ReturnType<typeof vi.fn>
  getAlerts: ReturnType<typeof vi.fn>
  getSuggestions: ReturnType<typeof vi.fn>
  createMealDelivery: ReturnType<typeof vi.fn>
  executeMenuPlan: ReturnType<typeof vi.fn>
  uploadDocument: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('getDashboard', () => {
  it('returns empty state when there is no olla', async () => {
    repo.getUserOlla.mockResolvedValue(null)
    const result = await getDashboard('t1')
    expect(result).toEqual({ olla: null, summary: { planificadas: 0, entregadas: 0 }, expiring: [] })
  })

  it('returns summary and expiring items when olla exists', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1', name: 'Olla A' })
    repo.getDailySummary.mockResolvedValue({ planificadas: 10, entregadas: 5, menu: null })
    repo.getExpiringItems.mockResolvedValue([{ id: 'i1', name: 'Arroz' }])
    const result = await getDashboard('t1')
    expect(result.olla?.id).toBe('o1')
    expect(result.summary.planificadas).toBe(10)
    expect(result.expiring).toHaveLength(1)
  })
})

describe('getInventory', () => {
  it('returns empty when no olla', async () => {
    repo.getUserOlla.mockResolvedValue(null)
    const result = await getInventory('t1')
    expect(result).toEqual({ items: [], categories: [] })
  })

  it('returns items and categories when olla exists', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.getInventory.mockResolvedValue([{ id: 'i1' }])
    repo.getSupplyCategories.mockResolvedValue([{ id: 'c1' }])
    const result = await getInventory('t1')
    expect(result.items).toHaveLength(1)
    expect(result.categories).toHaveLength(1)
  })
})

describe('createMovement', () => {
  it('throws 404 when no olla', async () => {
    repo.getUserOlla.mockResolvedValue(null)
    await expect(createMovement('t1', 'u1', {})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 400 when missing required fields', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    await expect(createMovement('t1', 'u1', { supplyItemId: 's1' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on non-numeric quantity', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    await expect(createMovement('t1', 'u1', { supplyItemId: 's1', movementType: 'in', quantity: 'abc' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on non-positive quantity', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    await expect(createMovement('t1', 'u1', { supplyItemId: 's1', movementType: 'in', quantity: 0 })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on invalid movement type', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    await expect(createMovement('t1', 'u1', { supplyItemId: 's1', movementType: 'fly', quantity: 1 })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('creates the movement successfully', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.createMovement.mockResolvedValue({ id: 'm1' })
    const result = await createMovement('t1', 'u1', { supplyItemId: 's1', movementType: 'in', quantity: 5, notes: 'ok' })
    expect(result.id).toBe('m1')
    expect(repo.createMovement).toHaveBeenCalledWith({
      tenantId: 't1',
      ollaId: 'o1',
      supplyItemId: 's1',
      movementType: 'in',
      quantity: 5,
      notes: 'ok',
      createdBy: 'u1',
    })
  })
})

describe('getAlerts / getSuggestions', () => {
  it('returns empty items when no olla', async () => {
    repo.getUserOlla.mockResolvedValue(null)
    expect(await getAlerts('t1')).toEqual({ items: [] })
    expect(await getSuggestions('t1')).toEqual({ items: [] })
  })

  it('returns mapped alerts', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.getAlerts.mockResolvedValue([
      { id: 'a1', alertType: 'low_stock', message: 'X', severity: 'high', status: 'open', detectedAt: new Date() },
    ])
    const result = await getAlerts('t1')
    expect(result.items[0]).toMatchObject({ id: 'a1' })
  })
})

describe('registerMealDelivery / runMenuPlanExecution', () => {
  it('registerMealDelivery delegates to repository', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.createMealDelivery.mockResolvedValue({ id: 'd1' })
    const result = await registerMealDelivery('t1', 'u1', { beneficiaryId: 'b1', totalRations: 5 })
    expect(result.id).toBe('d1')
    expect(repo.createMealDelivery).toHaveBeenCalled()
  })

  it('runMenuPlanExecution delegates to repository', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.executeMenuPlan.mockResolvedValue({ id: 'p1' })
    const result = await runMenuPlanExecution('t1', 'u1', { dishName: 'Lentejas', servings: 100 })
    expect(result.id).toBe('p1')
  })
})

describe('mobileRouter handleError', () => {
  function makeRes() {
    const res: any = {
      statusCode: 200,
      body: undefined as any,
      status(code: number) { this.statusCode = code; return this },
      json(payload: unknown) { this.body = payload; return this },
    }
    return res
  }

  function getHandler(method: string, path: string) {
    const layer = mobileRouter.stack.find((l: any) => l.route?.path === path && l.route?.methods?.[method.toLowerCase()])
    if (!layer) throw new Error(`route not found: ${method} ${path}`)
    return layer.route.stack[layer.route.stack.length - 1].handle
  }

  it('GET /dashboard maps P2025 to 404', async () => {
    const err = Object.assign(new Error('not found'), { code: 'P2025' })
    repo.getUserOlla.mockRejectedValue(err)
    const req = { user: { tenantId: 't1', userId: 'u1' } } as any
    const res = makeRes()
    await getHandler('GET', '/dashboard')(req, res, () => undefined)
    expect(res.statusCode).toBe(404)
  })

  it('GET /dashboard maps P2002 to 409', async () => {
    const err = Object.assign(new Error('dup'), { code: 'P2002' })
    repo.getUserOlla.mockRejectedValue(err)
    const req = { user: { tenantId: 't1', userId: 'u1' } } as any
    const res = makeRes()
    await getHandler('GET', '/dashboard')(req, res, () => undefined)
    expect(res.statusCode).toBe(409)
  })

  it('GET /dashboard maps P2003 to 400', async () => {
    const err = Object.assign(new Error('fk'), { code: 'P2003' })
    repo.getUserOlla.mockRejectedValue(err)
    const req = { user: { tenantId: 't1', userId: 'u1' } } as any
    const res = makeRes()
    await getHandler('GET', '/dashboard')(req, res, () => undefined)
    expect(res.statusCode).toBe(400)
  })

  it('GET /dashboard returns 500 for unknown errors', async () => {
    repo.getUserOlla.mockRejectedValue(new Error('boom'))
    const req = { user: { tenantId: 't1', userId: 'u1' } } as any
    const res = makeRes()
    await getHandler('GET', '/dashboard')(req, res, () => undefined)
    expect(res.statusCode).toBe(500)
  })

  it('GET /dashboard returns 200 on success', async () => {
    repo.getUserOlla.mockResolvedValue({ id: 'o1' })
    repo.getDailySummary.mockResolvedValue({ planificadas: 0, entregadas: 0, menu: null })
    repo.getExpiringItems.mockResolvedValue([])
    const req = { user: { tenantId: 't1', userId: 'u1' } } as any
    const res = makeRes()
    await getHandler('GET', '/dashboard')(req, res, () => undefined)
    expect(res.statusCode).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
