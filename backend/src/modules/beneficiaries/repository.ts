import { prisma } from '../../lib/prisma'
import { BeneficiaryPayload, BeneficiaryRecord, QueryFilters } from './types'

export class BeneficiaryRepository {
  async findAll(tenantId: string, filters: QueryFilters): Promise<BeneficiaryRecord[]> {
    const where: Record<string, unknown> = { tenantId }

    if (filters.ollaId) {
      where.ollaId = filters.ollaId
    }

    if (filters.healthConditionId) {
      where.healthConditions = {
        some: { healthConditionId: filters.healthConditionId },
      }
    }

    if (filters.query) {
      const search = filters.query.trim()
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
      ]
    }

    const rows = await prisma.beneficiary.findMany({
      where: where as any,
      include: {
        olla: { select: { id: true, name: true } },
        healthConditions: {
          include: { healthCondition: { select: { id: true, name: true } } },
        },
      },
      orderBy: { lastName: 'asc' },
    })

    return rows.map(this.toRecord)
  }

  async findById(id: string, tenantId: string): Promise<BeneficiaryRecord | null> {
    const row = await prisma.beneficiary.findFirst({
      where: { id, tenantId },
      include: {
        olla: { select: { id: true, name: true } },
        healthConditions: {
          include: { healthCondition: { select: { id: true, name: true } } },
        },
      },
    })

    return row ? this.toRecord(row) : null
  }

  async findByDni(dni: string, tenantId: string): Promise<BeneficiaryRecord | null> {
    const row = await prisma.beneficiary.findFirst({
      where: { dni, tenantId },
    })

    return row ? this.toRecord(row) : null
  }

  async create(data: BeneficiaryPayload & { tenantId: string }): Promise<BeneficiaryRecord> {
    const { healthConditionIds, ...fields } = data

    const result = await prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiary.create({
        data: {
          tenantId: fields.tenantId,
          ollaId: fields.ollaId ?? null,
          dni: fields.dni ?? null,
          firstName: fields.firstName,
          lastName: fields.lastName,
          gender: fields.gender ?? 'not_specified',
          birthDate: new Date(fields.birthDate),
          phone: fields.phone ?? null,
          address: fields.address ?? null,
          priorityLevel: fields.priorityLevel ?? 'normal',
          status: fields.status ?? 'active',
        },
      })

      if (healthConditionIds && healthConditionIds.length > 0) {
        await tx.beneficiaryHealthCondition.createMany({
          data: healthConditionIds.map((healthConditionId) => ({
            beneficiaryId: beneficiary.id,
            healthConditionId,
          })),
        })
      }

      return beneficiary
    })

    return (await this.findById(result.id, fields.tenantId))!
  }

  async update(
    id: string,
    tenantId: string,
    data: BeneficiaryPayload,
  ): Promise<BeneficiaryRecord | null> {
    const { healthConditionIds, ...fields } = data

    const result = await prisma.$transaction(async (tx) => {
      const beneficiary = await tx.beneficiary.update({
        where: { id },
        data: {
          ollaId: fields.ollaId ?? null,
          dni: fields.dni ?? null,
          firstName: fields.firstName,
          lastName: fields.lastName,
          gender: fields.gender ?? 'not_specified',
          birthDate: new Date(fields.birthDate),
          phone: fields.phone ?? null,
          address: fields.address ?? null,
          priorityLevel: fields.priorityLevel ?? 'normal',
          status: fields.status ?? 'active',
        },
      })

      await tx.beneficiaryHealthCondition.deleteMany({
        where: { beneficiaryId: id },
      })

      if (healthConditionIds && healthConditionIds.length > 0) {
        await tx.beneficiaryHealthCondition.createMany({
          data: healthConditionIds.map((healthConditionId) => ({
            beneficiaryId: id,
            healthConditionId,
          })),
        })
      }

      return beneficiary
    })

    return (await this.findById(result.id, tenantId))!
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    await prisma.beneficiary.deleteMany({
      where: { id, tenantId },
    })
    return true
  }

  async listHealthConditions(): Promise<{ id: number; name: string; status: string }[]> {
    return prisma.healthCondition.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    })
  }

  async listOllas(tenantId: string): Promise<{ id: string; name: string }[]> {
    return prisma.ollaComun.findMany({
      where: { tenantId, status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  private toRecord(row: any): BeneficiaryRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      ollaId: row.ollaId,
      dni: row.dni,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      birthDate: row.birthDate,
      phone: row.phone,
      address: row.address,
      priorityLevel: row.priorityLevel,
      status: row.status,
      registeredAt: row.registeredAt,
      olla: row.olla ?? null,
      healthConditions: row.healthConditions ?? [],
    }
  }
}

export const beneficiaryRepository = new BeneficiaryRepository()
