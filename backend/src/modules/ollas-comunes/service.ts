import { prisma } from '../../lib/prisma'
import { OllaServiceError } from './errors'
import { Olla } from './types'
import { sanitizeOllaText, toOlla } from './utils'

function parseOllaPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    throw new OllaServiceError(400, 'Datos inválidos para la olla común.')
  }
  const data = payload as Record<string, unknown>
  const name = sanitizeOllaText(data.name, 150)
  const address = sanitizeOllaText(data.address, 200)
  if (!name || !address) {
    throw new OllaServiceError(400, 'Nombre y dirección son obligatorios.')
  }
  return {
    name,
    address,
    latitude: typeof data.latitude === 'number' ? data.latitude : null,
    longitude: typeof data.longitude === 'number' ? data.longitude : null,
    contactName: sanitizeOllaText(data.contactName, 150),
    contactPhone: sanitizeOllaText(data.contactPhone, 20),
    estimatedDailyCapacity: typeof data.estimatedDailyCapacity === 'number' ? data.estimatedDailyCapacity : 50,
  }
}

export async function listOllasByTenantId(tenantId: string): Promise<Olla[]> {
  const records = await prisma.ollaComun.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
  return records.map(toOlla)
}

export async function createOlla(tenantId: string, payload: unknown): Promise<Olla> {
  const data = parseOllaPayload(payload)

  const lastOlla = await prisma.ollaComun.findFirst({
    where: { tenantId: tenantId },
    orderBy: { code: 'desc' },
  })

  let nextNumber = 1
  if (lastOlla?.code) {
    const match = lastOlla.code.match(/(\d+)$/)
    if (match) nextNumber = parseInt(match[1]) + 1
  }
  const code = `OC-${String(nextNumber).padStart(3, '0')}`

  const record = await prisma.ollaComun.create({
    data: {
      code,
      tenantId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      estimatedDailyCapacity: data.estimatedDailyCapacity,
      status: 'active',
    },
  })

  return toOlla(record)
}
