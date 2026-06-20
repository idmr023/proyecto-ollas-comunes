import { Olla, OllaDatabaseStatus, OllaRecord, OllaStatus } from './types'

export function sanitizeOllaText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export function mapOllaStatus(status: OllaDatabaseStatus): OllaStatus {
  return status === 'inactive' ? 'Inactiva' : 'Activa'
}

export function toOlla(record: OllaRecord): Olla {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    address: record.address ?? '',
    latitude: record.latitude,
    longitude: record.longitude,
    contactName: record.contactName ?? '',
    contactPhone: record.contactPhone ?? '',
    estimatedDailyCapacity: record.estimatedDailyCapacity ?? 50,
    status: mapOllaStatus(record.status as OllaDatabaseStatus),
    createdAt: record.createdAt ?? null,
  }
}
