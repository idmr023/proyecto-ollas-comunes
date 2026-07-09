import { prisma } from '../../lib/prisma'
import { OllaDatabaseStatus, OllaRecord } from './types'

interface CreateOllaData {
  tenantId: string
  code: string
  name: string
  address: string | null | undefined
  latitude: number | null | undefined
  longitude: number | null | undefined
  contactName: string | null | undefined
  contactPhone: string | null | undefined
  estimatedDailyCapacity: number | null | undefined
}

function toOllaRecord(row: {
  id: string
  tenantId: string
  code: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  estimatedDailyCapacity: number | null
  status: string
  createdAt: Date
}): OllaRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    estimatedDailyCapacity: row.estimatedDailyCapacity,
    status: row.status as OllaDatabaseStatus,
    createdAt: row.createdAt.toISOString(),
  }
}

async function findByTenantId(tenantId: string): Promise<OllaRecord[]> {
  const rows = await prisma.ollaComun.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
  return rows.map(toOllaRecord)
}

async function getExistingCodes(tenantId: string): Promise<string[]> {
  const rows = await prisma.ollaComun.findMany({
    where: { tenantId },
    select: { code: true },
  })
  return rows.map((r) => r.code)
}

async function create(data: CreateOllaData): Promise<OllaRecord> {
  const row = await prisma.ollaComun.create({
    data: {
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      estimatedDailyCapacity: data.estimatedDailyCapacity,
    },
  })
  return toOllaRecord(row)
}

export const ollaRepository = {
  findByTenantId,
  getExistingCodes,
  create,
}
