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

  const isLocal = connectionString.includes('127.0.0.1') || connectionString.includes('localhost')

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: parseInt(process.env.DB_POOL_MAX ?? '', 10) || 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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

const processedArgs = new WeakSet<object>()

function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    query: {
      $allOperations: async ({ model, operation, args, query }) => {
        if (processedArgs.has(args as object)) {
          processedArgs.delete(args as object)
          return query(args)
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
            // Defensa en profundidad: el userId ya viene validado desde el
            // middleware de auth, pero nunca se interpola en SQL crudo.
            if (!isUuid(userId)) {
              throw new Error('[prisma] userId de contexto no es un UUID valido.')
            }

            return client.$transaction(async (tx) => {
              await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`
              const modelKey = model.charAt(0).toLowerCase() + model.slice(1)
              processedArgs.add(args as object)
              return (tx as any)[modelKey][operation](args)
            })
          }
        }
        return query(args)
      },
    },
  })
}

import { userContextStorage } from './user-context'
import { isUuid } from './config/secrets'

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

export const isPrismaConfigured = (): boolean => {
  return Boolean(process.env.DATABASE_URL)
}
