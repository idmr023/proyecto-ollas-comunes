import cors from 'cors'
import express from 'express'

import { isSupabaseConfigured, supabase } from './lib/supabase'

const app = express()

app.use(cors())
app.use(express.json())

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
      message: 'SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no estan configuradas.',
    })
    return
  }

  const { error } = await supabase.storage.listBuckets()

  if (error) {
    response.status(503).json({
      ok: false,
      service: 'supabase',
      message: error.message,
    })
    return
  }

  response.json({
    ok: true,
    service: 'supabase',
    timestamp: new Date().toISOString(),
  })
})

export { app }