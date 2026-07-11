import { BeneficiaryServiceError } from './errors'
import { BeneficiaryPayload, BeneficiaryRecord, QueryFilters } from './types'
import { beneficiaryRepository } from './repository'
import { prisma } from '../../lib/prisma'
import { getPeruDayRange } from '../../lib/date-utils'

const MAX_NAME_LENGTH = 100
const MAX_DNI_LENGTH = 20
const MAX_PHONE_LENGTH = 30
const VALID_GENDERS = ['male', 'female', 'other', 'not_specified']
const VALID_PRIORITIES = ['low', 'normal', 'high']
const VALID_STATUSES = ['active', 'inactive']

function requireString(
  data: Record<string, unknown>,
  key: string,
  options: { required: boolean; maxLength?: number; requiredMessage: string; maxLengthMessage: string },
): string {
  const raw = data[key]
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (options.required && !value) {
    throw new BeneficiaryServiceError(400, options.requiredMessage)
  }
  if (options.maxLength && value.length > options.maxLength) {
    throw new BeneficiaryServiceError(400, options.maxLengthMessage)
  }
  return value
}

function optionalNullableString(data: Record<string, unknown>, key: string, maxLength?: number): string | null {
  const raw = data[key]
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null
  if (maxLength && value.length > maxLength) {
    throw new BeneficiaryServiceError(400, `El campo ${key} no puede exceder ${maxLength} caracteres.`)
  }
  return value
}

function validateBirthDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new BeneficiaryServiceError(400, 'La fecha de nacimiento no es valida.')
  }
  if (parsed > new Date()) {
    throw new BeneficiaryServiceError(400, 'La fecha de nacimiento no puede ser futura.')
  }
  return value
}

function enumValue(
  data: Record<string, unknown>,
  key: string,
  fallback: string,
  allowed: readonly string[],
  invalidMessage: string,
): string {
  const raw = typeof data[key] === 'string' ? (data[key] as string) : fallback
  if (!allowed.includes(raw)) {
    throw new BeneficiaryServiceError(400, invalidMessage)
  }
  return raw
}

function positiveIntIds(data: Record<string, unknown>, key: string): number[] {
  const raw = data[key]
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0,
  )
}

function parsePayload(payload: unknown): BeneficiaryPayload {
  if (!payload || typeof payload !== 'object') {
    throw new BeneficiaryServiceError(400, 'Datos invalidos para el beneficiario.')
  }

  const data = payload as Record<string, unknown>

  const firstName = requireString(data, 'firstName', {
    required: true,
    maxLength: MAX_NAME_LENGTH,
    requiredMessage: 'El nombre del beneficiario es obligatorio.',
    maxLengthMessage: 'El nombre no puede exceder 100 caracteres.',
  })

  const lastName = requireString(data, 'lastName', {
    required: true,
    maxLength: MAX_NAME_LENGTH,
    requiredMessage: 'Los apellidos del beneficiario son obligatorios.',
    maxLengthMessage: 'Los apellidos no pueden exceder 100 caracteres.',
  })

  const birthDate = validateBirthDate(
    requireString(data, 'birthDate', {
      required: true,
      requiredMessage: 'La fecha de nacimiento es obligatoria.',
      maxLengthMessage: 'La fecha de nacimiento no es valida.',
    }),
  )

  const dni = requireString(data, 'dni', {
    required: true,
    maxLength: MAX_DNI_LENGTH,
    requiredMessage: 'El DNI del beneficiario es obligatorio.',
    maxLengthMessage: 'El DNI no puede exceder 20 caracteres.',
  })

  const gender = enumValue(data, 'gender', 'not_specified', VALID_GENDERS, 'Genero no valido.')
  const ollaId = requireString(data, 'ollaId', {
    required: true,
    requiredMessage: 'La olla común es obligatoria.',
    maxLengthMessage: 'La olla común es obligatoria.',
  })
  const priorityLevel = enumValue(data, 'priorityLevel', 'normal', VALID_PRIORITIES, 'Nivel de prioridad no valido.')
  const status = enumValue(data, 'status', 'active', VALID_STATUSES, 'Estado no valido.')
  const phone = optionalNullableString(data, 'phone', MAX_PHONE_LENGTH)
  const address = optionalNullableString(data, 'address')
  const healthConditionIds = positiveIntIds(data, 'healthConditionIds')

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

  const { start: today, end: tomorrow } = getPeruDayRange()

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
      await prisma.alert.create({
        data: {
          tenantId,
          ollaId: data.ollaId,
          alertType: 'sync_conflict',
          severity: 'medium',
          message: `Intento de registro fallido: Beneficiario con DNI ${data.dni} ya está registrado.`,
          status: 'open',
        }
      })
      throw new BeneficiaryServiceError(409, 'Ya existe un beneficiario con ese DNI en esta organizacion.')
    }
  }

  const record = await beneficiaryRepository.create({ ...data, tenantId })

  // Registrar alerta de éxito
  await prisma.alert.create({
    data: {
      tenantId,
      ollaId: data.ollaId,
      alertType: 'new_beneficiary',
      severity: 'low',
      message: `Nuevo beneficiario registrado: ${data.firstName} ${data.lastName} (DNI: ${data.dni || '—'})`,
      status: 'open',
    }
  })

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
