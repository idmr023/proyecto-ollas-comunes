import { SupabaseRepository } from '../../lib/repository'
import { OrganizationRecord } from './types'
import { buildOrganizationSlug } from './utils'

const organizationSelect = 'id, code, name, category, location, latitude, longitude, status, created_at'

export class OrganizationRepository extends SupabaseRepository<OrganizationRecord, string> {
  protected tableName = 'tenants'
  protected selectColumns = organizationSelect

  protected toDomain(row: Record<string, unknown>): OrganizationRecord {
    return {
      id: row.id as string,
      code: row.code as string,
      name: row.name as string,
      category: row.category as string,
      location: row.location as string,
      latitude: row.latitude as number | null | undefined,
      longitude: row.longitude as number | null | undefined,
      status: row.status as 'active' | 'inactive',
      created_at: row.created_at as string,
    }
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
    const client = this.getClient()
    const { data, error } = await client
      .from(this.tableName)
      .select('code')

    if (error) {
      console.error('[OrganizationRepository] getExistingCodes error:', error)
      throw error
    }

    return (data ?? []).map((r: unknown) => (r as { code: string }).code)
  }
}

export const organizationRepository = new OrganizationRepository()
