import 'dotenv/config'

import { app } from './app'
import { getSupabaseConfigStatus } from './lib/supabase'
import { isPrismaConfigured } from './lib/prisma'

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? '0.0.0.0'
const publicUrl =
  process.env.PUBLIC_URL ?? (host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`)

app.listen(port, host, () => {
  console.log(`SIGO-OLLAS backend listening on ${publicUrl}`)
  try {
    console.log('supabase config:', getSupabaseConfigStatus())
    console.log('prisma configured:', isPrismaConfigured())
  } catch (err) {
    console.error('failed to read config status', err)
  }
})