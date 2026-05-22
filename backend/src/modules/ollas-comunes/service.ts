import { OllaServiceError } from './errors'
import { Olla, OllaPayload } from './types'
import { ollaRepository } from './repository'
import { mapOllaStatus, sanitizeOllaText, toOlla } from './utils'

function parseOllaPayload(payload: unknown): OllaPayload {
  if (!payload || typeof payload !== 'object') {
    throw new OllaServiceError(400, 'Datos invalidos para la olla comun.')
  }

  const data = payload as Record<string, unknown>
  const name = sanitizeOllaText(data.name, 150)
  const address = sanitizeOllaText(data.address, 500) || null
  const contactName = sanitizeOllaText(data.contactName, 150) || null
  const contactPhone = sanitizeOllaText(data.contactPhone, 30) || null

  if (!name) {
    throw new OllaServiceError(400, 'El nombre de la olla comun es obligatorio.')
  }

  const capacityRaw = data.estimatedDailyCapacity
  const estimatedDailyCapacity =
    typeof capacityRaw === 'number' && capacityRaw > 0 ? Math.floor(capacityRaw) : null

  return { name, address, contactName, contactPhone, estimatedDailyCapacity }
}

export async function listOllasByTenantId(tenantId: string): Promise<Olla[]> {
  const records = await ollaRepository.findByTenantId(tenantId)
  return records.map(toOlla)
}

export async function createOlla(
  tenantId: string,
  payload: unknown,
): Promise<Olla> {
  const data = parseOllaPayload(payload)

  const existingCodes = await ollaRepository.getExistingCodes(tenantId)
  const code = buildUniqueOllaCode(data.name, existingCodes)

  const record = await ollaRepository.create({
    tenantId,
    code,
    name: data.name,
    address: data.address,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    estimatedDailyCapacity: data.estimatedDailyCapacity,
  })

  return toOlla(record)
}

function buildBaseOllaCode(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return normalized.slice(0, 24) || 'OLLA'
}

function buildUniqueOllaCode(name: string, existingCodes: string[]) {
  const takenCodes = new Set(existingCodes)
  const baseCode = buildBaseOllaCode(name)

  if (!takenCodes.has(baseCode)) {
    return baseCode
  }

  let counter = 2

  while (counter < 1000) {
    const suffix = `-${counter}`
    const candidate = `${baseCode.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`

    if (!takenCodes.has(candidate)) {
      return candidate
    }

    counter += 1
  }

  return `${baseCode.slice(0, 20)}-${Date.now().toString().slice(-3)}`
}
