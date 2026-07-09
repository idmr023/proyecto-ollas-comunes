import { Router, Response } from "express"
import { getDashboard, getInventory, createMovement, getAlerts, getSuggestions, registerMealDelivery, runMenuPlanExecution, uploadDocument } from "./service"

const mobileRouter = Router()

function handleError(error: unknown, response: Response) {
  // Interceptar errores conocidos de Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaErr = error as { code: string; message?: string }
    if (prismaErr.code === 'P2002') {
      response.status(409).json({
        ok: false,
        message: 'Conflicto: Ya existe un registro con valores duplicados para un campo único (DNI u otro).',
      })
      return
    }
    if (prismaErr.code === 'P2003') {
      response.status(400).json({
        ok: false,
        message: 'Error de integridad: La operación hace referencia a un elemento que no existe (clave foránea no válida).',
      })
      return
    }
    if (prismaErr.code === 'P2025') {
      response.status(404).json({
        ok: false,
        message: 'No encontrado: El registro solicitado para actualizar o eliminar no existe.',
      })
      return
    }
  }

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

mobileRouter.post("/deliveries", async (request, response) => {
  try {
    const delivery = await registerMealDelivery(request.user!.tenantId, request.user!.userId, request.body)
    response.status(201).json({ ok: true, delivery })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.post("/menu-plans/execute", async (request, response) => {
  try {
    const plan = await runMenuPlanExecution(request.user!.tenantId, request.user!.userId, request.body)
    response.status(201).json({ ok: true, plan })
  } catch (error) {
    handleError(error, response)
  }
})

mobileRouter.post("/documents/upload", async (request, response) => {
  try {
    const document = await uploadDocument(request.user!.tenantId, request.user!.userId, request.body)
    response.status(201).json({ ok: true, document })
  } catch (error) {
    handleError(error, response)
  }
})

export { mobileRouter }
