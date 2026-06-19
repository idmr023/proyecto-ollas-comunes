import "dotenv/config"
import { prisma } from "../lib/prisma"
import { generarRecomendaciones } from "../jobs/generar_recomendaciones"

// Punto de entrada para el cron (ej. Render Cron Job a las 05:00 America/Lima):
//   npm run job:recomendaciones
async function main(): Promise<void> {
  console.log("[job:recomendaciones] Inicio")
  const resumen = await generarRecomendaciones()
  console.log(`[job:recomendaciones] Fin → procesadas: ${resumen.ollasProcesadas}, con error: ${resumen.ollasConError}`)
}

main()
  .catch((error) => {
    console.error("[job:recomendaciones] Error fatal:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
