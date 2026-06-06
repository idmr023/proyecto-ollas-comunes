import { Router, Response } from "express"
import { getDashboard, getInventory, createMovement, getAlerts, getSuggestions } from "./service"

const mobileRouter = Router()

function handleError(error: unknown, response: Response) {
  const err = error as Error & { statusCode?: number }
  const status = err.statusCode ?? 500
  response.status(status).json({
    ok: false,
    message: err.message ?? "Error interno del servidor.",
  })
}

mobileRouter.get("/dashboard", async (request, response) => {
  try {
    const data = await getDashboard(request.user!.tenantId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.get("/inventory", async (request, response) => {
  try {
    const data = await getInventory(request.user!.tenantId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.post("/inventory/movements", async (request, response) => {
  try {
    const movement = await createMovement(request.user!.tenantId, request.user!.userId, request.body)
    response.status(201).json({ ok: true, movement })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.get("/alerts", async (request, response) => {
  try {
    const data = await getAlerts(request.user!.tenantId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.get("/suggestions", async (request, response) => {
  try {
    const data = await getSuggestions(request.user!.tenantId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleError(error, response)
  }
})

export { mobileRouter }
