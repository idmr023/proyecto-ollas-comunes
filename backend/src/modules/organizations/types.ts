export type OrganizationDatabaseStatus = 'active' | 'inactive'

export type OrganizationStatus = 'Activa' | 'Inactiva'

export interface OrganizationRecord {
  id: string
  code: string
  name: string
  category: string
  location: string
  latitude?: number | null
  longitude?: number | null
  status: OrganizationDatabaseStatus
  created_at: string
}

export interface Organization {
  id: string
  slug: string
  code: string
  name: string
  category: string
  location: string
  latitude?: number | null
  longitude?: number | null
  status: OrganizationStatus
  createdAt: string | null
}

export interface OrganizationPayload {
  name: string
  category: string
  location: string
  latitude?: number | null
  longitude?: number | null
}
