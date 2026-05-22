export interface Beneficiary {
  id: string
  tenantId: string
  ollaId: string | null
  dni: string | null
  firstName: string
  lastName: string
  fullName: string
  gender: string
  birthDate: string
  phone: string | null
  address: string | null
  priorityLevel: string
  status: string
  registeredAt: string
  olla: { id: string; name: string } | null
  healthConditions: { id: number; name: string }[]
}

export interface HealthCondition {
  id: number
  name: string
  status: string
}

export interface BeneficiaryFormValues {
  firstName: string
  lastName: string
  dni?: string
  gender?: string
  birthDate: string
  phone?: string
  address?: string
  ollaId?: string
  priorityLevel?: string
  status?: string
  healthConditionIds?: number[]
}

export interface BeneficiaryFilters {
  query?: string
  ollaId?: string
  healthConditionId?: string
}
