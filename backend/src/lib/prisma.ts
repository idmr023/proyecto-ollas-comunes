import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}