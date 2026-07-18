import 'dotenv/config'

import { app } from './app'
import { getSupabaseConfigStatus } from './lib/supabase'
import { isPrismaConfigured, prisma } from './lib/prisma'
import { startPerformanceMonitoring } from './lib/metrics'

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST ?? '0.0.0.0'
const publicUrl =
  process.env.PUBLIC_URL ?? (host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`)

app.listen(port, host, async () => {
  console.log(`SIGO-OLLAS backend listening on ${publicUrl}`)
  
  // Iniciar monitoreo de performance si estamos corriendo pruebas de estrés
  startPerformanceMonitoring(5000)
  try {
    console.log('supabase config:', getSupabaseConfigStatus())
    console.log('prisma configured:', isPrismaConfigured())

    // Test Prisma connection
    if (isPrismaConfigured()) {
      await prisma.$queryRaw`SELECT 1 as ok`
      console.log('prisma connection: OK')
    }
  } catch (err) {
    console.error('failed to connect on startup:', err)
  }
})