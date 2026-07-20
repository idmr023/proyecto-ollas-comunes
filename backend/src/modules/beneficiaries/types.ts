export interface BeneficiaryRecord {
  id: string
  tenantId: string
  ollaId: string | null
  dni: string | null
  firstName: string
  lastName: string
  gender: string
  birthDate: Date
  phone: string | null
  address: string | null
  priorityLevel: string
  status: string
  registeredAt: Date
  olla: { id: string; name: string } | null
  healthConditions: { healthConditionId: number; healthCondition: { id: number; name: string } }[]
}

export interface BeneficiaryPayload {
  firstName: string
  lastName: string
  dni: string
  gender?: string
  birthDate: string
  phone?: string | null
  address?: string | null
  ollaId: string
  priorityLevel?: string
  status?: string
  healthConditionIds?: number[]
}

export interface QueryFilters {
  query?: string
  ollaId?: string
  healthConditionId?: number
}
