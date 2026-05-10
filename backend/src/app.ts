import cors from 'cors'
import express from 'express'

import {
  getSupabaseConfigStatus,
  isSupabaseConfigured,
  supabase,
  supabaseHealthcheckTable,
} from './lib/supabase'
import { organizationsRouter } from './modules/organizations/router'

const app = express()

if (process.env.ALLOWED_ORIGINS) {
  app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(',') }))
} else {
  app.use(cors())
}

app.use(express.json())
app.use('/api/organizations', organizationsRouter)

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
