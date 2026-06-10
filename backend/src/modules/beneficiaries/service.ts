import { BeneficiaryServiceError } from './errors'
import { BeneficiaryPayload, BeneficiaryRecord, QueryFilters } from './types'
import { beneficiaryRepository } from './repository'
import { prisma } from '../../lib/prisma'

function parsePayload(payload: unknown): BeneficiaryPayload {
  if (!payload || typeof payload !== 'object') {
    throw new BeneficiaryServiceError(400, 'Datos invalidos para el beneficiario.')
  }

  const data = payload as Record<string, unknown>

  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : ''
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : ''
  const birthDate = typeof data.birthDate === 'string' ? data.birthDate.trim() : ''

  if (!firstName) {
    throw new BeneficiaryServiceError(400, 'El nombre del beneficiario es obligatorio.')
  }

  if (!lastName) {
    throw new BeneficiaryServiceError(400, 'Los apellidos del beneficiario son obligatorios.')
  }

  if (!birthDate) {
    throw new BeneficiaryServiceError(400, 'La fecha de nacimiento es obligatoria.')
  }

  if (firstName.length > 100) {
    throw new BeneficiaryServiceError(400, 'El nombre no puede exceder 100 caracteres.')
  }

  if (lastName.length > 100) {
    throw new BeneficiaryServiceError(400, 'Los apellidos no pueden exceder 100 caracteres.')
  }

  const parsedDate = new Date(birthDate)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new BeneficiaryServiceError(400, 'La fecha de nacimiento no es valida.')
  }

  if (parsedDate > new Date()) {
    throw new BeneficiaryServiceError(400, 'La fecha de nacimiento no puede ser futura.')
  }

  const dni = typeof data.dni === 'string' ? data.dni.trim() || null : null
  if (dni && dni.length > 20) {
    throw new BeneficiaryServiceError(400, 'El DNI no puede exceder 20 caracteres.')
  }

  const gender = typeof data.gender === 'string' ? data.gender : 'not_specified'
  const validGenders = ['male', 'female', 'other', 'not_specified']
  if (!validGenders.includes(gender)) {
    throw new BeneficiaryServiceError(400, 'Genero no valido.')
  }

  const phone = typeof data.phone === 'string' ? data.phone.trim() || null : null
  const address = typeof data.address === 'string' ? data.address.trim() || null : null
  const ollaId = typeof data.ollaId === 'string' ? (data.ollaId.trim() || null) : null
  const priorityLevel = typeof data.priorityLevel === 'string' ? data.priorityLevel : 'normal'
  const validPriorities = ['low', 'normal', 'high']
  if (!validPriorities.includes(priorityLevel)) {
    throw new BeneficiaryServiceError(400, 'Nivel de prioridad no valido.')
  }

  const status = typeof data.status === 'string' ? data.status : 'active'
  if (!['active', 'inactive'].includes(status)) {
    throw new BeneficiaryServiceError(400, 'Estado no valido.')
  }

  const rawConditions = data.healthConditionIds
  let healthConditionIds: number[] = []
  if (Array.isArray(rawConditions)) {
    healthConditionIds = rawConditions.filter(
      (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0,
    )
  }

  return {
    firstName,
    lastName,
    dni,
    gender,
    birthDate,
    phone,
    address,
    ollaId,
    priorityLevel,
    status,
    healthConditionIds,
  }
}

function toResponse(record: BeneficiaryRecord) {
  return {
    id: record.id,
    tenantId: record.tenantId,
    ollaId: record.ollaId,
    dni: record.dni,
    firstName: record.firstName,
    lastName: record.lastName,
    fullName: `${record.firstName} ${record.lastName}`,
    gender: record.gender,
    birthDate: record.birthDate.toISOString(),
    phone: record.phone,
    address: record.address,
    priorityLevel: record.priorityLevel,
    status: record.status,
    registeredAt: record.registeredAt.toISOString(),
    olla: record.olla,
    healthConditions: record.healthConditions.map((hc) => ({
      id: hc.healthCondition.id,
      name: hc.healthCondition.name,
    })),
  }
}

export async function getAllBeneficiaries(tenantId: string, filters: QueryFilters) {
  const records = await beneficiaryRepository.findAll(tenantId, filters)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const deliveriesToday = await prisma.mealDeliveryDetail.findMany({
    where: {
      delivery: {
        deliveredAt: { gte: today, lt: tomorrow }
      }
    },
    select: { beneficiaryId: true }
  })

  const eatenSet = new Set(deliveriesToday.map(d => d.beneficiaryId))

  return records.map(record => {
    const response = toResponse(record)
    return {
      ...response,
      hasEatenToday: eatenSet.has(record.id)
    }
  })
}

export async function getBeneficiaryById(id: string, tenantId: string) {
  const record = await beneficiaryRepository.findById(id, tenantId)

  if (!record) {
    throw new BeneficiaryServiceError(404, 'Beneficiario no encontrado.')
  }

  return toResponse(record)
}

export async function registerBeneficiary(tenantId: string, payload: unknown) {
  const data = parsePayload(payload)

  if (data.dni) {
    const existing = await beneficiaryRepository.findByDni(data.dni, tenantId)
    if (existing) {
      throw new BeneficiaryServiceError(409, 'Ya existe un beneficiario con ese DNI en esta organizacion.')
    }
  }

  const record = await beneficiaryRepository.create({ ...data, tenantId })
  return toResponse(record)
}

export async function updateBeneficiary(id: string, tenantId: string, payload: unknown) {
  const current = await beneficiaryRepository.findById(id, tenantId)

  if (!current) {
    throw new BeneficiaryServiceError(404, 'Beneficiario no encontrado.')
  }

  const data = parsePayload(payload)

  if (data.dni) {
    const existing = await beneficiaryRepository.findByDni(data.dni, tenantId)
    if (existing && existing.id !== id) {
      throw new BeneficiaryServiceError(409, 'Ya existe otro beneficiario con ese DNI en esta organizacion.')
    }
  }

  const record = await beneficiaryRepository.update(id, tenantId, data)
  return toResponse(record!)
}

export async function removeBeneficiary(id: string, tenantId: string) {
  const current = await beneficiaryRepository.findById(id, tenantId)

  if (!current) {
    throw new BeneficiaryServiceError(404, 'Beneficiario no encontrado.')
  }

  await beneficiaryRepository.delete(id, tenantId)
  return { deleted: true }
}

export async function getHealthConditions() {
  return beneficiaryRepository.listHealthConditions()
}

export async function getTenantOllas(tenantId: string) {
  return beneficiaryRepository.listOllas(tenantId)
}
