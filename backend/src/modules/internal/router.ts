import { Router } from "express"
import { generarRecomendaciones } from "../../jobs/generar_recomendaciones"

// Rutas internas para tareas operativas (cron, jobs). NO se exponen a la app ni
// al público: se protegen con el secreto JOB_SECRET en la cabecera x-job-secret.
const internalRouter = Router()

internalRouter.use((request, response, next) => {
  const secreto = process.env.JOB_SECRET
  if (!secreto || request.header("x-job-secret") !== secreto) {
    response.status(401).json({ ok: false, message: "No autorizado." })
    return
  }
  next()
})

internalRouter.post("/jobs/recomendaciones", async (_request, response) => {
  try {
    const resumen = await generarRecomendaciones()
    response.json({ ok: true, ...resumen })
  } catch (error) {
    console.error("[internal] Error en job recomendaciones:", error)
    response.status(500).json({ ok: false, message: "Error ejecutando el job." })
  }
})

export { internalRouter }
