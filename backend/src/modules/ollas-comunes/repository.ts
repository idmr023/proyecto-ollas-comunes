import { prisma } from '../../lib/prisma'
import { OllaRecord } from './types'

export class OllaRepository {
  async findByTenantId(tenantId: string): Promise<OllaRecord[]> {
    const rows = await prisma.ollaComun.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })
    return rows.map(this.toRecord)
  }

  async findById(id: string): Promise<OllaRecord | null> {
    const row = await prisma.ollaComun.findUnique({ where: { id } })
    return row ? this.toRecord(row) : null
  }

  async findByTenantAndCode(
    tenantId: string,
    code: string,
  ): Promise<OllaRecord | null> {
    const row = await prisma.ollaComun.findUnique({
      where: { tenantId_code: { tenantId, code } },
    })
    return row ? this.toRecord(row) : null
  }

  async getExistingCodes(tenantId: string): Promise<string[]> {
    const rows = await prisma.ollaComun.findMany({
      where: { tenantId },
      select: { code: true },
    })
    return rows.map((r) => r.code)
  }

  async create(data: {
    tenantId: string
    code: string
    name: string
    address?: string | null
    contactName?: string | null
    contactPhone?: string | null
    estimatedDailyCapacity?: number | null
  }): Promise<OllaRecord> {
    const row = await prisma.ollaComun.create({ data })
    return this.toRecord(row)
  }

  private toRecord(row: {
    id: string
    tenantId: string
    code: string
    name: string
    address: string | null
    contactName: string | null
    contactPhone: string | null
    estimatedDailyCapacity: number | null
    status: string
    createdAt: Date
  }): OllaRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      code: row.code,
      name: row.name,
      address: row.address,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      estimatedDailyCapacity: row.estimatedDailyCapacity,
      status: row.status as 'active' | 'inactive',
      createdAt: row.createdAt.toISOString(),
    }
  }
}

export const ollaRepository = new OllaRepository()
