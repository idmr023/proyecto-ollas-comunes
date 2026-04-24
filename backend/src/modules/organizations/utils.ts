import {
  Organization,
  OrganizationDatabaseStatus,
  OrganizationRecord,
  OrganizationStatus,
} from './types'

export function buildOrganizationSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildBaseOrganizationCode(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return normalized.slice(0, 24) || 'ORG'
}

export function buildUniqueOrganizationCode(name: string, existingCodes: string[]) {
  const takenCodes = new Set(existingCodes)
  const baseCode = buildBaseOrganizationCode(name)

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

export function sanitizeOrganizationText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export function mapOrganizationStatus(status: OrganizationDatabaseStatus): OrganizationStatus {
  return status === 'inactive' ? 'Inactiva' : 'Activa'
}

export function mapDatabaseStatus(status: unknown): OrganizationDatabaseStatus {
  return status === 'Inactiva' || status === 'inactive' ? 'inactive' : 'active'
}

export function toOrganization(record: OrganizationRecord): Organization {
  return {
    id: record.id,
    slug: buildOrganizationSlug(record.name),
    code: record.code,
    name: record.name,
    category: record.category,
    location: record.location,
    status: mapOrganizationStatus(record.status),
    createdAt: record.created_at ?? null,
  }
}
