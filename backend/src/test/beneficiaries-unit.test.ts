import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    beneficiary: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    beneficiaryHealthCondition: { createMany: vi.fn(), deleteMany: vi.fn() },
    healthCondition: { findMany: vi.fn() },
    ollaComun: { findMany: vi.fn() },
    alert: { create: vi.fn() },
    mealDeliveryDetail: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '../lib/prisma'
import { BeneficiaryRepository } from '../modules/beneficiaries/repository'
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  registerBeneficiary,
  updateBeneficiary,
  removeBeneficiary,
  getHealthConditions,
  getTenantOllas,
} from '../modules/beneficiaries/service'
import { BeneficiaryServiceError } from '../modules/beneficiaries/errors'

const beneficiaryFindMany = vi.mocked(prisma.beneficiary.findMany)
const beneficiaryFindFirst = vi.mocked(prisma.beneficiary.findFirst)
const beneficiaryCreate = vi.mocked(prisma.beneficiary.create)
const beneficiaryUpdate = vi.mocked(prisma.beneficiary.update)
const beneficiaryDeleteMany = vi.mocked(prisma.beneficiary.deleteMany)
const hcCreateMany = vi.mocked(prisma.beneficiaryHealthCondition.createMany)
const hcDeleteMany = vi.mocked(prisma.beneficiaryHealthCondition.deleteMany)
const healthConditionFindMany = vi.mocked(prisma.healthCondition.findMany)
const ollaComunFindMany = vi.mocked(prisma.ollaComun.findMany)
const alertCreate = vi.mocked(prisma.alert.create)
const mealDeliveryDetailFindMany = vi.mocked(prisma.mealDeliveryDetail.findMany)
const transaction = vi.mocked(prisma.$transaction)

beforeEach(() => {
  vi.resetAllMocks()
})

const sampleBeneficiary = {
  id: 'b1',
  tenantId: 't1',
  ollaId: 'o1',
  olla: { id: 'o1', name: 'Olla A' },
  dni: '12345678',
  firstName: 'Maria',
  lastName: 'Lopez',
  gender: 'female',
  birthDate: new Date('1990-05-15T00:00:00Z'),
  phone: '999',
  address: 'Av 1',
  priorityLevel: 'normal',
  status: 'active',
  registeredAt: new Date('2026-01-01T00:00:00Z'),
  healthConditions: [],
}

describe('BeneficiaryRepository', () => {
  it('findAll maps healthConditions to plain objects', async () => {
    beneficiaryFindMany.mockResolvedValue([
      {
        ...sampleBeneficiary,
        healthConditions: [{ healthCondition: { id: 1, name: 'Diabetes' } }],
      },
    ] as any)
    const repo = new BeneficiaryRepository()
    const result = await repo.findAll('t1', {})
    expect(result[0].healthConditions).toEqual([{ healthCondition: { id: 1, name: 'Diabetes' } }])
  })

  it('findAll applies ollaId filter', async () => {
    beneficiaryFindMany.mockResolvedValue([])
    const repo = new BeneficiaryRepository()
    await repo.findAll('t1', { ollaId: 'o1' })
    expect(beneficiaryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ollaId: 'o1' }) }),
    )
  })

  it('findAll applies healthConditionId filter', async () => {
    beneficiaryFindMany.mockResolvedValue([])
    const repo = new BeneficiaryRepository()
    await repo.findAll('t1', { healthConditionId: 5 })
    expect(beneficiaryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ healthConditions: { some: { healthConditionId: 5 } } }) }),
    )
  })

  it('findAll applies query (search) filter', async () => {
    beneficiaryFindMany.mockResolvedValue([])
    const repo = new BeneficiaryRepository()
    await repo.findAll('t1', { query: '  Maria ' })
    expect(beneficiaryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
    )
  })

  it('findById returns mapped record', async () => {
    beneficiaryFindFirst.mockResolvedValue(sampleBeneficiary as any)
    const repo = new BeneficiaryRepository()
    expect((await repo.findById('b1', 't1'))?.firstName).toBe('Maria')
  })

  it('findById returns null when missing', async () => {
    beneficiaryFindFirst.mockResolvedValue(null)
    const repo = new BeneficiaryRepository()
    expect(await repo.findById('b1', 't1')).toBeNull()
  })

  it('findByDni returns mapped record', async () => {
    beneficiaryFindFirst.mockResolvedValue(sampleBeneficiary as any)
    const repo = new BeneficiaryRepository()
    expect((await repo.findByDni('12345678', 't1'))?.dni).toBe('12345678')
  })

  it('create inside transaction', async () => {
    transaction.mockImplementation(async (cb: any) => {
      const tx = {
        beneficiary: { create: vi.fn().mockResolvedValue({ ...sampleBeneficiary, id: 'b-new' }) },
        beneficiaryHealthCondition: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }
      return cb(tx)
    })
    beneficiaryFindFirst.mockResolvedValue({ ...sampleBeneficiary, id: 'b-new' })
    const repo = new BeneficiaryRepository()
    const result = await repo.create({
      firstName: 'Maria',
      lastName: 'Lopez',
      birthDate: '1990-05-15',
      dni: '12345678',
      ollaId: 'o1',
      healthConditionIds: [1, 2],
      tenantId: 't1',
    })
    expect(result.id).toBe('b-new')
  })

  it('update inside transaction and re-fetch', async () => {
    transaction.mockImplementation(async (cb: any) => {
      const tx = {
        beneficiary: { update: vi.fn().mockResolvedValue({ ...sampleBeneficiary, firstName: 'New' }) },
        beneficiaryHealthCondition: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }), createMany: vi.fn().mockResolvedValue({ count: 0 }) },
      }
      return cb(tx)
    })
    beneficiaryFindFirst.mockResolvedValue({ ...sampleBeneficiary, firstName: 'New' })
    const repo = new BeneficiaryRepository()
    const result = await repo.update('b1', 't1', {
      firstName: 'New',
      lastName: 'Lopez',
      birthDate: '1990-05-15',
      dni: '12345678',
      ollaId: 'o1',
    })
    expect(result.firstName).toBe('New')
  })

  it('delete returns true', async () => {
    beneficiaryDeleteMany.mockResolvedValue({ count: 1 })
    const repo = new BeneficiaryRepository()
    expect(await repo.delete('b1', 't1')).toBe(true)
  })

  it('listHealthConditions returns active conditions', async () => {
    healthConditionFindMany.mockResolvedValue([{ id: 1, name: 'Diabetes', status: 'active' }] as any)
    const repo = new BeneficiaryRepository()
    const result = await repo.listHealthConditions()
    expect(result[0].name).toBe('Diabetes')
  })

  it('listOllas returns active ollas', async () => {
    ollaComunFindMany.mockResolvedValue([{ id: 'o1', name: 'Olla A' }] as any)
    const repo = new BeneficiaryRepository()
    expect(await repo.listOllas('t1')).toEqual([{ id: 'o1', name: 'Olla A' }])
  })
})

describe('getAllBeneficiaries', () => {
  it('returns mapped list with hasEatenToday=false when no deliveries', async () => {
    beneficiaryFindMany.mockResolvedValue([sampleBeneficiary] as any)
    mealDeliveryDetailFindMany.mockResolvedValue([])
    const result = await getAllBeneficiaries('t1', {})
    expect(result[0].hasEatenToday).toBe(false)
  })

  it('marks hasEatenToday=true when a delivery exists for the beneficiary', async () => {
    beneficiaryFindMany.mockResolvedValue([sampleBeneficiary] as any)
    mealDeliveryDetailFindMany.mockResolvedValue([{ beneficiaryId: 'b1' }] as any)
    const result = await getAllBeneficiaries('t1', {})
    expect(result[0].hasEatenToday).toBe(true)
  })
})

describe('getBeneficiaryById', () => {
  it('throws 404 when missing', async () => {
    beneficiaryFindFirst.mockResolvedValue(null)
    await expect(getBeneficiaryById('b1', 't1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns mapped beneficiary when found', async () => {
    beneficiaryFindFirst.mockResolvedValue(sampleBeneficiary as any)
    const result = await getBeneficiaryById('b1', 't1')
    expect(result.firstName).toBe('Maria')
  })
})

describe('registerBeneficiary', () => {
  const valid = {
    firstName: 'Maria',
    lastName: 'Lopez',
    birthDate: '1990-05-15',
    dni: '12345678',
    ollaId: 'o1',
  }

  it('throws 400 on invalid payload', async () => {
    await expect(registerBeneficiary('t1', null as any)).rejects.toBeInstanceOf(BeneficiaryServiceError)
  })

  it('throws 400 when name missing', async () => {
    await expect(registerBeneficiary('t1', { ...valid, firstName: '' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when birthDate is in the future', async () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 5)
    await expect(registerBeneficiary('t1', { ...valid, birthDate: future.toISOString().slice(0, 10) })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on invalid gender', async () => {
    await expect(registerBeneficiary('t1', { ...valid, gender: 'martian' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on invalid priority', async () => {
    await expect(registerBeneficiary('t1', { ...valid, priorityLevel: 'urgent' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 on invalid status', async () => {
    await expect(registerBeneficiary('t1', { ...valid, status: 'pending' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when DNI already exists and creates an alert', async () => {
    beneficiaryFindFirst.mockResolvedValue(sampleBeneficiary as any)
    alertCreate.mockResolvedValue({} as any)
    await expect(registerBeneficiary('t1', valid)).rejects.toMatchObject({ statusCode: 409 })
    expect(alertCreate).toHaveBeenCalled()
  })

  it('creates a new beneficiary and a success alert', async () => {
    beneficiaryFindFirst.mockResolvedValue(null)
    transaction.mockImplementation(async (cb: any) => {
      const tx = {
        beneficiary: { create: vi.fn().mockResolvedValue({ ...sampleBeneficiary, id: 'b-new' }) },
        beneficiaryHealthCondition: { createMany: vi.fn() },
      }
      return cb(tx)
    })
    beneficiaryFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...sampleBeneficiary, id: 'b-new' })
    alertCreate.mockResolvedValue({} as any)
    const result = await registerBeneficiary('t1', { ...valid, healthConditionIds: [1, 2] })
    expect(result.id).toBe('b-new')
    expect(alertCreate).toHaveBeenCalled()
  })
})

describe('updateBeneficiary', () => {
  const valid = {
    firstName: 'Maria',
    lastName: 'Lopez',
    birthDate: '1990-05-15',
    dni: '12345678',
    ollaId: 'o1',
  }

  it('throws 404 when beneficiary not found', async () => {
    beneficiaryFindFirst.mockResolvedValue(null)
    await expect(updateBeneficiary('b1', 't1', valid)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 409 when DNI conflicts with another beneficiary', async () => {
    beneficiaryFindFirst
      .mockResolvedValueOnce(sampleBeneficiary as any)
      .mockResolvedValueOnce({ ...sampleBeneficiary, id: 'other' } as any)
    await expect(updateBeneficiary('b1', 't1', valid)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('updates the beneficiary when DNI is the same', async () => {
    transaction.mockImplementation(async (cb: any) => {
      const tx = {
        beneficiary: { update: vi.fn().mockResolvedValue({ ...sampleBeneficiary, firstName: 'Updated' }) },
        beneficiaryHealthCondition: { deleteMany: vi.fn(), createMany: vi.fn() },
      }
      return cb(tx)
    })
    beneficiaryFindFirst
      .mockResolvedValueOnce(sampleBeneficiary as any) // findById in updateBeneficiary
      .mockResolvedValueOnce(sampleBeneficiary as any) // findByDni in updateBeneficiary
      .mockResolvedValueOnce({ ...sampleBeneficiary, firstName: 'Updated' } as any) // findById in repository.update
    const result = await updateBeneficiary('b1', 't1', { ...valid, firstName: 'Updated' })
    expect(result.firstName).toBe('Updated')
  })
})

describe('removeBeneficiary', () => {
  it('throws 404 when missing', async () => {
    beneficiaryFindFirst.mockResolvedValue(null)
    await expect(removeBeneficiary('b1', 't1')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('deletes and returns deleted=true', async () => {
    beneficiaryFindFirst.mockResolvedValue(sampleBeneficiary as any)
    beneficiaryDeleteMany.mockResolvedValue({ count: 1 })
    const result = await removeBeneficiary('b1', 't1')
    expect(result.deleted).toBe(true)
  })
})

describe('getHealthConditions / getTenantOllas', () => {
  it('returns conditions list', async () => {
    healthConditionFindMany.mockResolvedValue([{ id: 1, name: 'Diabetes', status: 'active' }] as any)
    const result = await getHealthConditions()
    expect(result[0].name).toBe('Diabetes')
  })

  it('returns ollas list', async () => {
    ollaComunFindMany.mockResolvedValue([{ id: 'o1', name: 'Olla A' }] as any)
    const result = await getTenantOllas('t1')
    expect(result[0].name).toBe('Olla A')
  })
})
