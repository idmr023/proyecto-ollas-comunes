import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { Organization, OrganizationPayload, OrganizationRecord } from './types'
import {
  buildOrganizationSlug,
  buildUniqueOrganizationCode,
  mapDatabaseStatus,
  sanitizeOrganizationText,
  toOrganization,
} from './utils'

const organizationSelect = 'id, code, name, category, location, latitude, longitude, status, created_at'

export class OrganizationServiceError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'OrganizationServiceError'
    this.statusCode = statusCode
  }
}

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new OrganizationServiceError(
      500,
      'SUPABASE_URL o SUPABASE_SECRET_KEY no estan configuradas.',
    )
  }

  return supabase
}

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

  const latitudeRaw = data.latitude
  const longitudeRaw = data.longitude

  const latitude = typeof latitudeRaw === 'number' ? latitudeRaw : null
  const longitude = typeof longitudeRaw === 'number' ? longitudeRaw : null

  return {
    name,
    category,
    location,
    latitude,
    longitude,
  }
}

async function listOrganizationRecords() {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('tenants')
    .select(organizationSelect)
    .order('name', { ascending: true })

  if (error) {
    throw new OrganizationServiceError(503, error.message)
  }

  return (data ?? []) as OrganizationRecord[]
}

async function findOrganizationRecordBySlug(slug: string) {
  const organizationRecords = await listOrganizationRecords()
  return (
    organizationRecords.find(
      (organization) => buildOrganizationSlug(organization.name) === slug,
    ) ?? null
  )
}

export async function listOrganizations() {
  const organizationRecords = await listOrganizationRecords()
  return organizationRecords.map(toOrganization)
}

export async function getOrganizationBySlug(slug: string) {
  const organizationRecord = await findOrganizationRecordBySlug(slug)

  if (!organizationRecord) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  return toOrganization(organizationRecord)
}

export async function createOrganization(payload: unknown) {
  const client = getSupabaseClient()
  const data = parseOrganizationPayload(payload)
  const organizationRecords = await listOrganizationRecords()
  const nextSlug = buildOrganizationSlug(data.name)

  if (
    organizationRecords.some(
      (organization) => buildOrganizationSlug(organization.name) === nextSlug,
    )
  ) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const code = buildUniqueOrganizationCode(
    data.name,
    organizationRecords.map((organization) => organization.code),
  )

  const { data: createdOrganization, error } = await client
    .from('tenants')
    .insert({
      code,
      name: data.name,
      category: data.category,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      status: 'active',
    })
    .select(organizationSelect)
    .single()

  if (error) {
    throw new OrganizationServiceError(503, error.message)
  }

  return toOrganization(createdOrganization as OrganizationRecord)
}

export async function updateOrganizationBySlug(slug: string, payload: unknown) {
  const client = getSupabaseClient()
  const currentOrganization = await findOrganizationRecordBySlug(slug)

  if (!currentOrganization) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const data = parseOrganizationPayload(payload)
  const nextSlug = buildOrganizationSlug(data.name)
  const organizationRecords = await listOrganizationRecords()

  if (
    organizationRecords.some(
      (organization) =>
        organization.id !== currentOrganization.id &&
        buildOrganizationSlug(organization.name) === nextSlug,
    )
  ) {
    throw new OrganizationServiceError(
      409,
      'Ya existe una organizacion con un nombre equivalente.',
    )
  }

  const { data: updatedOrganization, error } = await client
    .from('tenants')
    .update({
      name: data.name,
      category: data.category,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    })
    .eq('id', currentOrganization.id)
    .select(organizationSelect)
    .single()

  if (error) {
    throw new OrganizationServiceError(503, error.message)
  }

  return toOrganization(updatedOrganization as OrganizationRecord)
}

export async function updateOrganizationStatusBySlug(slug: string, status: unknown) {
  const client = getSupabaseClient()
  const currentOrganization = await findOrganizationRecordBySlug(slug)

  if (!currentOrganization) {
    throw new OrganizationServiceError(404, 'Organizacion no encontrada.')
  }

  const { data: updatedOrganization, error } = await client
    .from('tenants')
    .update({
      status: mapDatabaseStatus(status),
    })
    .eq('id', currentOrganization.id)
    .select(organizationSelect)
    .single()

  if (error) {
    throw new OrganizationServiceError(503, error.message)
  }

  return toOrganization(updatedOrganization as OrganizationRecord)
}
