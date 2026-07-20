import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import {
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
  supabaseHealthcheckTable,
} from './lib/supabase'
import { prisma, isPrismaConfigured } from './lib/prisma'
import { resolveAllowedOrigins } from './lib/cors'
import { requireAuth } from './lib/middleware/auth'
import { debugDetail } from './lib/debug'
import { authRouter } from './modules/auth/router'
import { beneficiariesRouter } from './modules/beneficiaries/router'
import { mobileRouter } from './modules/mobile/router'
import { organizationsRouter } from './modules/organizations/router'
import { notificationsRouter } from './modules/notifications/router'

const app = express()

// Trust proxy (Render, Vercel, etc. behind load balancers)
app.set('trust proxy', 1)

// --- Security middlewares (applied globally) ---

app.use(helmet())

// Rate limiting for auth routes: max 5 requests per minute per IP (relaxed in dev/test)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '', 10) || (process.env.NODE_ENV === 'production' ? 5 : 10000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
})

// Limitador global: hasta ahora solo /api/auth estaba protegido, dejando el
// resto de la API sin techo de peticiones.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:
    parseInt(process.env.RATE_LIMIT_GLOBAL_MAX ?? '', 10) ||
    (process.env.NODE_ENV === 'production' ? 300 : 100000),
  standardHeaders: true,
  legacyHeaders: false,
  // Los healthchecks de la plataforma no deben consumir cuota.
  skip: (request) => request.path.startsWith('/api/health'),
  message: { ok: false, message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
})

// --- CORS (whitelist explícita, sin comodines) ---

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const isProd = NODE_ENV === 'production'

const allowedOrigins = resolveAllowedOrigins(isProd)

if (isProd && allowedOrigins.length === 0) {
  throw new Error(
    'CORS misconfigured: ALLOWED_ORIGINS must be set in production. Refusing to start.'
  )
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (curl, server-to-server, healthchecks)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    // Necesario para que el navegador envie y acepte la cookie de sesion.
    // Es seguro porque el origen se valida contra una whitelist explicita
    // (nunca un comodin), que es justo lo que `credentials: true` exige.
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

// Acota el cuerpo de las peticiones: sin limite explicito, un solo POST puede
// forzar al proceso a materializar un JSON arbitrariamente grande en memoria.
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '10mb' }))

app.use(globalLimiter)

// --- Routes ---

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/beneficiaries', requireAuth, beneficiariesRouter)
app.use('/api/mobile', requireAuth, mobileRouter)
app.use('/api/organizations', requireAuth, organizationsRouter)
app.use('/api/notifications', requireAuth, notificationsRouter)

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
    // El detalle va al log, no a la respuesta: estos endpoints son publicos y
    // el mensaje de Prisma revela host, puerto y nombres de tablas.
    console.error('[health] Fallo de conexion con Prisma:', error)
    response.status(503).json({
      ok: false,
      service: 'prisma',
      ...debugDetail(error),
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
      console.error('[health] Fallo de conexion con Supabase (tabla):', error)
      response.status(503).json({
        ok: false,
        service: 'supabase',
        mode: 'table',
        ...debugDetail(error),
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
    console.error('[health] Fallo de conexion con Supabase (storage):', error)
    response.status(503).json({
      ok: false,
      service: 'supabase',
      mode: 'storage',
      ...debugDetail(error),
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
