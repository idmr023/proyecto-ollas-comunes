import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no esta configurada. Prisma no puede conectarse a la base de datos.',
    )
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10, // Limit connections to avoid Supabase limits
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 2000,
  })

  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  })

  return extendPrismaClient(client) as unknown as PrismaClient
}

function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    query: {
      $allOperations: async ({ model, operation, args, query }) => {
        // Evitar recursión si ya configuramos el contexto
        if (args && (args as any).__contextSet) {
          const { __contextSet, ...cleanArgs } = args as any
          return query(cleanArgs)
        }

        const mutations = [
          'create',
          'update',
          'delete',
          'createMany',
          'updateMany',
          'deleteMany',
          'upsert',
        ]

        if (model && mutations.includes(operation)) {
          const userId = userContextStorage.getStore()?.userId
          if (userId) {
            return client.$transaction(async (tx) => {
              await tx.$executeRawUnsafe(
                `SELECT set_config('app.current_user_id', '${userId}', true)`,
              )
              const modifiedArgs = { ...args, __contextSet: true }
              const modelKey = model.charAt(0).toLowerCase() + model.slice(1)
              return (tx as any)[modelKey][operation](modifiedArgs)
            })
          }
        }
        return query(args)
      },
    },
  })
}

import { userContextStorage } from './user-context'

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

export const isPrismaConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL)
}
