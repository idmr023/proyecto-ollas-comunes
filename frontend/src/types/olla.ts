export type OllaStatus = 'Activa' | 'Inactiva'

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

export interface OllaFormValues {
  name: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  contactName?: string
  contactPhone?: string
  estimatedDailyCapacity?: number
}
