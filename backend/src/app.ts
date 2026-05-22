import cors from 'cors'
import express from 'express'

import {
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
  supabaseHealthcheckTable,
} from './lib/supabase'
import { prisma, isPrismaConfigured } from './lib/prisma'
import { requireAuth } from './lib/middleware/auth'
import { authRouter } from './modules/auth/router'
import { beneficiariesRouter } from './modules/beneficiaries/router'
import { organizationsRouter } from './modules/organizations/router'

const app = express()

const rawAllowed = process.env.ALLOWED_ORIGINS
if (rawAllowed) {
  const allowed = rawAllowed.split(',').map((s) => s.trim()).filter(Boolean)
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow non-browser requests (curl, server-to-server)
        if (!origin) return callback(null, true)

        // direct match
        if (allowed.includes(origin)) return callback(null, true)

        // allow by suffix (e.g., allow 'vercel.app' to match any preview domain)
        for (const a of allowed) {
          if (a && origin.endsWith(a)) return callback(null, true)
        }

        callback(new Error('Not allowed by CORS'))
      },
    }),
  )
} else {
  app.use(cors())
}

app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/beneficiaries', requireAuth, beneficiariesRouter)
app.use('/api/organizations', requireAuth, organizationsRouter)

app.get('/', (_request, response) => {
  response.json({
    name: 'SIGO-OLLAS API',
    status: 'ready',
  })
})

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'backend',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health/prisma', async (_request, response) => {
  if (!isPrismaConfigured()) {
    response.status(500).json({
      ok: false,
      service: 'prisma',
      message: 'DATABASE_URL no esta configurada.',
    })
    return
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({
      ok: true,
      service: 'prisma',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    response.status(503).json({
      ok: false,
      service: 'prisma',
      message: error instanceof Error ? error.message : 'Error de conexion con Prisma',
    })
  }
})

app.get('/api/health/supabase', async (_request, response) => {
  if (!isSupabaseConfigured || !supabase) {
    response.status(500).json({
      ok: false,
      service: 'supabase',
      message: 'SUPABASE_URL o SUPABASE_SECRET_KEY no estan configuradas.',
      config: getSupabaseConfigStatus(),
    })
    return
  }

  if (supabaseHealthcheckTable) {
    const { error } = await supabase
      .from(supabaseHealthcheckTable)
      .select('*', { count: 'exact', head: true })

    if (error) {
      response.status(503).json({
        ok: false,
        service: 'supabase',
        mode: 'table',
        table: supabaseHealthcheckTable,
        message: error.message,
      })
      return
    }

    response.json({
      ok: true,
      service: 'supabase',
      mode: 'table',
      table: supabaseHealthcheckTable,
      timestamp: new Date().toISOString(),
    })
    return
  }

  const { error } = await supabase.storage.listBuckets()

  if (error) {
    response.status(503).json({
      ok: false,
      service: 'supabase',
      mode: 'storage',
      message: error.message,
    })
    return
  }

  response.json({
    ok: true,
    service: 'supabase',
    mode: 'storage',
    message:
      'Conexion valida con Supabase. Define SUPABASE_HEALTHCHECK_TABLE para validar tambien una tabla de la base.',
    timestamp: new Date().toISOString(),
  })
})

export { app }
