import { prisma } from '../../lib/prisma'
import { OrganizationRecord } from './types'
import { buildOrganizationSlug } from './utils'

export class OrganizationRepository {
  async findAll(): Promise<OrganizationRecord[]> {
    const rows = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    })
    return rows.map(this.toRecord)
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const row = await prisma.tenant.findUnique({ where: { id } })
    return row ? this.toRecord(row) : null
  }

  async findBySlug(slug: string): Promise<OrganizationRecord | null> {
    const all = await this.findAll()
    return all.find((o) => buildOrganizationSlug(o.name) === slug) ?? null
  }

  async findByName(name: string): Promise<OrganizationRecord | null> {
    const slug = buildOrganizationSlug(name)
    return this.findBySlug(slug)
  }

  async findDuplicatesByName(excludeId: string, name: string): Promise<boolean> {
    const all = await this.findAll()
    const slug = buildOrganizationSlug(name)
    return all.some((o) => o.id !== excludeId && buildOrganizationSlug(o.name) === slug)
  }

  async existsByName(name: string): Promise<boolean> {
    return (await this.findByName(name)) !== null
  }

  async getExistingCodes(): Promise<string[]> {
    const rows = await prisma.tenant.findMany({ select: { code: true } })
    return rows.map((r) => r.code)
  }

  async create(data: {
    code: string
    name: string
    category: string
    location: string
    latitude?: number | null
    longitude?: number | null
    status?: string
  }): Promise<OrganizationRecord> {
    const row = await prisma.tenant.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        location: data.location,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: data.status ?? 'active',
      },
    })
    return this.toRecord(row)
  }

  async update(
    id: string,
    data: Partial<{
      name: string
      category: string
      location: string
      latitude: number | null
      longitude: number | null
      status: string
    }>,
  ): Promise<OrganizationRecord | null> {
    const row = await prisma.tenant.update({
      where: { id },
      data,
    })
    return this.toRecord(row)
  }

  async delete(id: string): Promise<boolean> {
    await prisma.tenant.delete({ where: { id } })
    return true
  }

  private toRecord(row: {
    id: string
    code: string
    name: string
    category: string
    location: string
    latitude: number | null
    longitude: number | null
    status: string
    createdAt: Date
  }): OrganizationRecord {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category,
      location: row.location,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status as 'active' | 'inactive',
      created_at: row.createdAt.toISOString(),
    }
  }
}

export const organizationRepository = new OrganizationRepository()
