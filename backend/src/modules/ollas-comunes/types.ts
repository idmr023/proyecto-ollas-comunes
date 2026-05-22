export type OllaDatabaseStatus = 'active' | 'inactive'

export type OllaStatus = 'Activa' | 'Inactiva'

export interface OllaRecord {
  id: string
  tenantId: string
  code: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  estimatedDailyCapacity: number | null
  status: OllaDatabaseStatus
  createdAt: string
}

export interface Olla {
  id: string
  code: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  estimatedDailyCapacity: number | null
  status: OllaStatus
  createdAt: string | null
}

export interface OllaPayload {
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  contactName?: string | null
  contactPhone?: string | null
  estimatedDailyCapacity?: number | null
}
