import { OrganizationServiceError } from './errors'
import { Organization, OrganizationPayload } from './types'
import { organizationRepository } from './repository'
import {
  buildOrganizationSlug,
  buildUniqueOrganizationCode,
  mapDatabaseStatus,
  sanitizeOrganizationText,
  toOrganization,
} from './utils'

function parseOrganizationPayload(payload: unknown): OrganizationPayload {
  if (!payload || typeof payload !== 'object') {
    throw new OrganizationServiceError(400, 'Datos invalidos para la organizacion.')
  }

  const data = payload as Record<string, unknown>
  const name = sanitizeOrganizationText(data.name, 150)
  const category = sanitizeOrganizationText(data.category, 100)
  const location = sanitizeOrganizationText(data.location, 100)

  if (!name || !category || !location) {
    throw new OrganizationServiceError(
      400,
      'Nombre, categoria y ubicacion son obligatorios.',
    )
  }

  return { name, category, location }
}

export async function listOrganizations(): Promise<Organization[]> {
  const records = await organizationRepository.findAll()
  return records.map(toOrganization)
}

export async function getOrganizationBySlug(slug: string): Promise<Organization> {
  const record = await organizationRepository.findBySlug(slug)

  if (!record) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  return toOrganization(record)
}

export async function createOrganization(payload: unknown): Promise<Organization> {
  const data = parseOrganizationPayload(payload)

  const exists = await organizationRepository.existsByName(data.name)
  if (exists) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const existingCodes = await organizationRepository.getExistingCodes()
  const code = buildUniqueOrganizationCode(data.name, existingCodes)

  const record = await organizationRepository.create({
    code,
    name: data.name,
    category: data.category,
    location: data.location,
    status: 'active',
  })

  return toOrganization(record)
}

export async function updateOrganizationBySlug(slug: string, payload: unknown): Promise<Organization> {
  const current = await organizationRepository.findBySlug(slug)

  if (!current) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const data = parseOrganizationPayload(payload)

  const hasDuplicate = await organizationRepository.findDuplicatesByName(current.id, data.name)
  if (hasDuplicate) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const updated = await organizationRepository.update(current.id, {
    name: data.name,
    category: data.category,
    location: data.location,
  })

  if (!updated) {
    throw new OrganizationServiceError(500, 'Error al actualizar la organizacion.')
  }

  return toOrganization(updated)
}

export async function updateOrganizationStatusBySlug(slug: string, status: unknown): Promise<Organization> {
  const current = await organizationRepository.findBySlug(slug)

  if (!current) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const updated = await organizationRepository.update(current.id, {
    status: mapDatabaseStatus(status),
  })

  if (!updated) {
    throw new OrganizationServiceError(500, 'Error al actualizar el estado de la organizacion.')
  }

  return toOrganization(updated)
}
