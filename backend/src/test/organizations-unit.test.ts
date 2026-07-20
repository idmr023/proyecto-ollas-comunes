import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    ollaComun: { count: vi.fn() },
    beneficiary: { count: vi.fn() },
    supplyItem: { count: vi.fn() },
    alert: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    inventoryStock: { findMany: vi.fn() },
    inventoryMovement: { findMany: vi.fn() },
  },
}))

import { prisma } from '../lib/prisma'

const tenantDelete = vi.mocked(prisma.tenant.delete)
import { OrganizationRepository } from '../modules/organizations/repository'
import {
  listOrganizationsForTenant,
  getOrganizationForTenant,
  createOrganization,
  updateOrganizationForTenant,
  updateOrganizationStatusForTenant,
  getAdminDashboard,
  getTenantInventoryStock,
  getTenantInventoryMovements,
  getTenantAlerts,
  updateTenantAlert,
} from '../modules/organizations/service'
import { OrganizationServiceError } from '../modules/organizations/errors'

const tenantFindMany = vi.mocked(prisma.tenant.findMany)
const tenantFindUnique = vi.mocked(prisma.tenant.findUnique)
const tenantFindFirst = vi.mocked(prisma.tenant.findFirst)
const tenantCreate = vi.mocked(prisma.tenant.create)
const tenantUpdate = vi.mocked(prisma.tenant.update)
const tenantCount = vi.mocked(prisma.tenant.count)
const ollaCount = vi.mocked(prisma.ollaComun.count)
const beneficiaryCount = vi.mocked(prisma.beneficiary.count)
const supplyItemCount = vi.mocked(prisma.supplyItem.count)
const alertFindMany = vi.mocked(prisma.alert.findMany)
const inventoryStockFindMany = vi.mocked(prisma.inventoryStock.findMany)
const inventoryMovementFindMany = vi.mocked(prisma.inventoryMovement.findMany)

beforeEach(() => {
  vi.resetAllMocks()
})

const sampleTenant = {
  id: '11111111-1111-1111-1111-111111111111',
  code: 'MUNI-LIMA',
  name: 'Municipalidad de Lima',
  category: 'municipal',
  location: 'Lima',
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

describe('OrganizationRepository', () => {
  it('findAll returns mapped records', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    const repo = new OrganizationRepository()
    const result = await repo.findAll()
    expect(result[0]).toMatchObject({ id: sampleTenant.id, name: sampleTenant.name, code: sampleTenant.code })
  })

  it('findById returns null when not found', async () => {
    tenantFindUnique.mockResolvedValue(null)
    const repo = new OrganizationRepository()
    expect(await repo.findById('x')).toBeNull()
  })

  it('findById returns mapped record when found', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    const repo = new OrganizationRepository()
    const result = await repo.findById(sampleTenant.id)
    expect(result?.id).toBe(sampleTenant.id)
  })

  it('findBySlug searches by normalized name', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    const repo = new OrganizationRepository()
    const result = await repo.findBySlug('municipalidad-de-lima')
    expect(result?.id).toBe(sampleTenant.id)
  })

  it('findByName derives the slug and delegates', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    const repo = new OrganizationRepository()
    const result = await repo.findByName('Municipalidad de Lima')
    expect(result?.id).toBe(sampleTenant.id)
  })

  it('findDuplicatesByName returns true when another org matches', async () => {
    tenantFindMany.mockResolvedValue([
      sampleTenant,
      { ...sampleTenant, id: 'other-id', name: 'Municipalidad de Lima' },
    ] as any)
    const repo = new OrganizationRepository()
    expect(await repo.findDuplicatesByName(sampleTenant.id, 'Municipalidad de Lima')).toBe(true)
  })

  it('findDuplicatesByName returns false when self is only match', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    const repo = new OrganizationRepository()
    expect(await repo.findDuplicatesByName(sampleTenant.id, 'Municipalidad de Lima')).toBe(false)
  })

  it('existsByName returns true if matching organization exists', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    const repo = new OrganizationRepository()
    expect(await repo.existsByName('Municipalidad de Lima')).toBe(true)
  })

  it('getExistingCodes returns list of codes', async () => {
    tenantFindMany.mockResolvedValue([{ code: 'A' }, { code: 'B' }] as any)
    const repo = new OrganizationRepository()
    expect(await repo.getExistingCodes()).toEqual(['A', 'B'])
  })

  it('create inserts and returns the record', async () => {
    tenantCreate.mockResolvedValue(sampleTenant as any)
    const repo = new OrganizationRepository()
    const created = await repo.create({ code: 'MUNI-LIMA', name: 'Municipalidad de Lima', category: 'municipal', location: 'Lima' })
    expect(created.id).toBe(sampleTenant.id)
    expect(tenantCreate).toHaveBeenCalled()
  })

  it('update mutates and returns the record', async () => {
    tenantUpdate.mockResolvedValue({ ...sampleTenant, name: 'New Name' } as any)
    const repo = new OrganizationRepository()
    const updated = await repo.update(sampleTenant.id, { name: 'New Name' })
    expect(updated?.name).toBe('New Name')
  })

  it('delete returns true and calls prisma.tenant.delete', async () => {
    const repo = new OrganizationRepository()
    expect(await repo.delete(sampleTenant.id)).toBe(true)
    expect(tenantDelete).toHaveBeenCalledWith({ where: { id: sampleTenant.id } })
  })
})

describe('listOrganizationsForTenant', () => {
  it('returns only the caller organization', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    const list = await listOrganizationsForTenant(sampleTenant.id)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ name: sampleTenant.name, status: 'Activa' })
    // C-2: nunca debe recorrer todos los tenants de la plataforma.
    expect(tenantFindMany).not.toHaveBeenCalled()
  })

  it('returns an empty list when the tenant no longer exists', async () => {
    tenantFindUnique.mockResolvedValue(null)
    expect(await listOrganizationsForTenant(sampleTenant.id)).toEqual([])
  })
})

describe('getOrganizationForTenant', () => {
  it('throws 404 when not found', async () => {
    tenantFindUnique.mockResolvedValue(null)
    await expect(
      getOrganizationForTenant('nope', sampleTenant.id),
    ).rejects.toBeInstanceOf(OrganizationServiceError)
  })

  it('returns mapped organization when the slug is the caller own', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    const result = await getOrganizationForTenant('municipalidad-de-lima', sampleTenant.id)
    expect(result.name).toBe(sampleTenant.name)
  })

  /* --- C-2: IDOR cross-tenant --- */

  it('throws 404 (not 403) for a slug belonging to another tenant', async () => {
    // El tenant del token es el sample; se pide el slug de otra organizacion.
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    await expect(
      getOrganizationForTenant('municipalidad-de-otro-lugar', sampleTenant.id),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('resolves by tenant id, never by scanning every tenant', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    await getOrganizationForTenant('municipalidad-de-lima', sampleTenant.id)
    expect(tenantFindUnique).toHaveBeenCalledWith({ where: { id: sampleTenant.id } })
  })
})

describe('createOrganization', () => {
  const valid = { name: 'Municipalidad de Lima', category: 'municipal', location: 'Lima' }

  it('throws 400 when payload is invalid', async () => {
    await expect(createOrganization(null as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when name already exists', async () => {
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    await expect(createOrganization(valid)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates with a unique code and returns mapped org', async () => {
    tenantFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ code: 'MUNI-LIMA' }] as any)
    tenantCreate.mockResolvedValue(sampleTenant as any)
    const result = await createOrganization(valid)
    expect(result.name).toBe(valid.name)
    expect(tenantCreate).toHaveBeenCalled()
  })
})

describe('updateOrganizationForTenant', () => {
  it('throws 404 when slug not found', async () => {
    tenantFindUnique.mockResolvedValue(null)
    await expect(
      updateOrganizationForTenant('nope', sampleTenant.id, { name: 'X', category: 'c', location: 'l' }),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when name conflicts with another org', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    tenantFindMany.mockResolvedValueOnce([{ ...sampleTenant, id: 'other' }] as any)
    await expect(
      updateOrganizationForTenant('municipalidad-de-lima', sampleTenant.id, { name: 'Municipalidad de Lima', category: 'c', location: 'l' }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('updates and returns the mapped org', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    tenantFindMany.mockResolvedValue([sampleTenant] as any)
    tenantUpdate.mockResolvedValue({ ...sampleTenant, name: 'New Name' } as any)
    const result = await updateOrganizationForTenant('municipalidad-de-lima', sampleTenant.id, { name: 'New Name', category: 'c', location: 'l' })
    expect(result.name).toBe('New Name')
  })

  /* --- C-2: la mutacion cross-tenant era el hallazgo mas grave --- */

  it('refuses to modify an organization belonging to another tenant', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    await expect(
      updateOrganizationForTenant('organizacion-ajena', sampleTenant.id, { name: 'Hijacked', category: 'c', location: 'l' }),
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(tenantUpdate).not.toHaveBeenCalled()
  })
})

describe('updateOrganizationStatusForTenant', () => {
  it('throws 404 when slug not found', async () => {
    tenantFindUnique.mockResolvedValue(null)
    await expect(
      updateOrganizationStatusForTenant('nope', sampleTenant.id, 'Activa'),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('maps Spanish status to db value and updates', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    tenantUpdate.mockResolvedValue({ ...sampleTenant, status: 'inactive' } as any)
    const result = await updateOrganizationStatusForTenant('municipalidad-de-lima', sampleTenant.id, 'Inactiva')
    expect(result.status).toBe('Inactiva')
    expect(tenantUpdate).toHaveBeenCalledWith({ where: { id: sampleTenant.id }, data: { status: 'inactive' } })
  })

  it('refuses to deactivate an organization belonging to another tenant', async () => {
    tenantFindUnique.mockResolvedValue(sampleTenant as any)
    await expect(
      updateOrganizationStatusForTenant('organizacion-ajena', sampleTenant.id, 'Inactiva'),
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(tenantUpdate).not.toHaveBeenCalled()
  })
})

describe('getAdminDashboard', () => {
  it('aggregates counts and lists recent alerts', async () => {
    tenantCount.mockResolvedValue(3 as any)
    ollaCount.mockResolvedValue(10 as any)
    beneficiaryCount.mockResolvedValue(150 as any)
    supplyItemCount.mockResolvedValue(80 as any)
    alertFindMany.mockResolvedValue([
      {
        id: 'a1',
        alertType: 'low_stock',
        message: 'Arroz bajo',
        detectedAt: new Date('2026-07-01T00:00:00Z'),
        olla: { name: 'Olla Centro' },
      },
    ] as any)
    inventoryStockFindMany.mockResolvedValue([
      {
        quantity: { toString: () => '2' },
        supplyItem: { name: 'Arroz', unit: 'kg' },
        olla: { name: 'Olla Centro' },
      },
    ] as any)
    const dashboard = await getAdminDashboard(sampleTenant.id)
    expect(dashboard.kpis).toEqual({ tenants: 3, ollas: 10, beneficiaries: 150, supplyItems: 80 })
    expect(dashboard.activities[0]).toMatchObject({ ollaName: 'Olla Centro' })
    expect(dashboard.lowStock[0]).toMatchObject({ name: 'Arroz', stock: '2 kg', isCritical: false })
  })

  it('marks zero-quantity stock as critical', async () => {
    tenantCount.mockResolvedValue(0 as any)
    ollaCount.mockResolvedValue(0 as any)
    beneficiaryCount.mockResolvedValue(0 as any)
    supplyItemCount.mockResolvedValue(0 as any)
    alertFindMany.mockResolvedValue([])
    inventoryStockFindMany.mockResolvedValue([
      {
        quantity: { toString: () => '0' },
        supplyItem: { name: 'Lenteja', unit: 'kg' },
        olla: { name: 'Olla A' },
      },
    ] as any)
    const dashboard = await getAdminDashboard(sampleTenant.id)
    expect(dashboard.lowStock[0].isCritical).toBe(true)
  })

  it('uses Sistema when alert has no olla', async () => {
    tenantCount.mockResolvedValue(0 as any)
    ollaCount.mockResolvedValue(0 as any)
    beneficiaryCount.mockResolvedValue(0 as any)
    supplyItemCount.mockResolvedValue(0 as any)
    alertFindMany.mockResolvedValue([
      { id: 'a1', alertType: 'system', message: 'X', detectedAt: new Date(), olla: null },
    ] as any)
    inventoryStockFindMany.mockResolvedValue([])
    const dashboard = await getAdminDashboard(sampleTenant.id)
    expect(dashboard.activities[0].ollaName).toBe('Sistema')
  })
})

describe('getTenantInventoryStock', () => {
  it('returns mapped stock entries', async () => {
    inventoryStockFindMany.mockResolvedValue([
      {
        ollaId: 'o1',
        olla: { name: 'Olla A' },
        supplyItemId: 's1',
        supplyItem: { name: 'Arroz', unit: 'kg', category: { name: 'Granos' } },
        quantity: { toString: () => '15' },
        updatedAt: new Date('2026-07-01T00:00:00Z'),
      },
    ] as any)
    const result = await getTenantInventoryStock(sampleTenant.id)
    expect(result[0]).toMatchObject({ ollaName: 'Olla A', supplyItemName: 'Arroz', quantity: 15, unit: 'kg' })
  })
})

describe('getTenantInventoryMovements', () => {
  it('returns mapped movements', async () => {
    inventoryMovementFindMany.mockResolvedValue([
      {
        id: 'm1',
        olla: { name: 'Olla A' },
        ollaId: 'o1',
        supplyItem: { name: 'Arroz', unit: 'kg' },
        movementType: 'in',
        quantity: { toString: () => '10' },
        movementDate: new Date('2026-07-01T00:00:00Z'),
        notes: 'Compra',
        source: null,
        createdByUser: { fullName: 'Admin' },
      },
    ] as any)
    const result = await getTenantInventoryMovements(sampleTenant.id)
    expect(result[0]).toMatchObject({ movementType: 'in', quantity: 10, createdByName: 'Admin' })
  })
})

describe('getTenantAlerts', () => {
  it('returns mapped alerts with Sistema fallback', async () => {
    alertFindMany.mockResolvedValue([
      { id: 'a1', olla: null, ollaId: null, alertType: 'system', severity: 'high', message: 'X', status: 'open', detectedAt: new Date(), resolvedAt: null },
    ] as any)
    const result = await getTenantAlerts(sampleTenant.id)
    expect(result[0]).toMatchObject({ ollaName: 'Sistema' })
  })
})

describe('updateTenantAlert', () => {
  it('throws 404 when alert not found', async () => {
    vi.mocked(prisma.alert.findFirst).mockResolvedValue(null)
    await expect(updateTenantAlert('a1', sampleTenant.id, 'resolved')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('sets resolvedAt when status is resolved', async () => {
    vi.mocked(prisma.alert.findFirst).mockResolvedValue({ id: 'a1' } as any)
    vi.mocked(prisma.alert.update).mockResolvedValue({
      id: 'a1',
      olla: null,
      ollaId: null,
      status: 'resolved',
      detectedAt: new Date(),
      resolvedAt: new Date(),
    } as any)
    const result = await updateTenantAlert('a1', sampleTenant.id, 'resolved')
    expect(result.status).toBe('resolved')
    expect(prisma.alert.update).toHaveBeenCalled()
  })
})
