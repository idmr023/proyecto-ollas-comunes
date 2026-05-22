export type OllaStatus = 'Activa' | 'Inactiva'

export interface Olla {
  id: string
  code: string
  name: string
  address: string | null
  contactName: string | null
  contactPhone: string | null
  estimatedDailyCapacity: number | null
  status: OllaStatus
  createdAt: string | null
}

export interface OllaFormValues {
  name: string
  address?: string
  contactName?: string
  contactPhone?: string
  estimatedDailyCapacity?: number
}
