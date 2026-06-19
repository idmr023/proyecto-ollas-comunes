export type OllaDatabaseStatus = 'active' | 'inactive'

export type OllaStatus = 'Activa' | 'Inactiva'

export interface OllaRecord {
  id: string
  code: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  estimatedDailyCapacity: number | null
  status: string
  createdAt: Date | null
}

export interface Olla {
  id: string
  code: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  contactName: string
  contactPhone: string
  estimatedDailyCapacity: number
  status: OllaStatus
  createdAt: Date | null
}
