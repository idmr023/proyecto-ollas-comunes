import { Router, Response } from 'express'
import { mobileRepository } from './repository'
import {
  executeMenuPlan,
  getMobileAlerts,
  getMobileDashboard,
  getMobileSuggestions,
  MobileServiceError,
  registerInventoryMovement,
  registerMealDelivery,
  resolveMobileAlert,
  uploadMobileDocument,
} from './service'

const mobileRouter = Router()

function getOllaIdFromRequest(tenantId: string, request: any): string | null {
  const explicitOllaId = request.query?.ollaId || request.body?.ollaId
  if (explicitOllaId && typeof explicitOllaId === 'string') return explicitOllaId
  return null
}

async function resolveOllaId(tenantId: string, request: any): Promise<string | null> {
  const ollaId = getOllaIdFromRequest(tenantId, request)
  if (ollaId) return ollaId

  const olla = await mobileRepository.getUserOlla(tenantId)
  return olla?.id || null
}

function handleMobileError(error: unknown, response: Response) {
  if (error instanceof MobileServiceError) {
    response.status(error.statusCode).json({ ok: false, message: error.message })
    return
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const prismaErr = error as { code: string; message?: string }
    if (prismaErr.code === 'P2002') {
      response.status(409).json({ ok: false, message: 'Conflicto: Ya existe un registro con valores duplicados.' })
      return
    }
    if (prismaErr.code === 'P2003') {
      response.status(400).json({ ok: false, message: 'Error de integridad: Referencia a elemento inexistente.' })
      return
    }
    if (prismaErr.code === 'P2025') {
      response.status(404).json({ ok: false, message: 'No encontrado: El registro no existe.' })
      return
    }
  }

  console.error('[mobile] Error inesperado:', error)
  response.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    ...(process.env.NODE_ENV !== 'production' ? { detail: String(error) } : {}),
  })
}

mobileRouter.get('/health', (_request, response) => {
  response.json({ ok: true, module: 'mobile' })
})

mobileRouter.get('/dashboard', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.json({ ok: true, olla: null, summary: {}, stock: [], lowStockAlerts: [], alerts: [] })
      return
    }

    const data = await getMobileDashboard(tenantId, ollaId)
    if (!data) {
      response.json({ ok: true, olla: null, summary: {}, stock: [], lowStockAlerts: [], alerts: [] })
      return
    }

    response.json({ ok: true, ...data })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.post('/inventory/movements', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
      return
    }

    const data = registerInventoryMovement(tenantId, ollaId, {
      supplyItemId: request.body.supplyItemId,
      movementType: request.body.movementType,
      quantity: Number(request.body.quantity),
      sourceId: request.body.sourceId,
      notes: request.body.notes,
      createdBy: request.user!.userId,
    })

    response.status(201).json({ ok: true, movement: await data })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.post('/deliveries', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
      return
    }

    const delivery = await registerMealDelivery(ollaId, {
      beneficiaryIds: request.body.beneficiaryIds || [],
      totalRations: request.body.totalRations,
      dishName: request.body.dishName,
      createdBy: request.user!.userId,
    })

    response.status(201).json({ ok: true, delivery })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.post('/menu-plans/execute', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
      return
    }

    const plan = await executeMenuPlan(tenantId, ollaId, {
      dishName: request.body.dishName,
      servings: Number(request.body.servings),
      recipeId: request.body.recipeId,
      createdBy: request.user!.userId,
    })

    response.status(201).json({ ok: true, plan })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.get('/suggestions', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.json({ ok: true, recommendations: [], expiringStock: [] })
      return
    }

    const data = await getMobileSuggestions(tenantId, ollaId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.get('/alerts', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.json({ ok: true, items: [] })
      return
    }

    const items = await getMobileAlerts(tenantId, ollaId)
    response.json({ ok: true, items })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.patch('/alerts/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
      return
    }

    const item = await resolveMobileAlert(request.params.id, ollaId)
    response.json({ ok: true, item })
  } catch (error) {
    handleMobileError(error, response)
  }
})

mobileRouter.post('/documents/upload', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const ollaId = await resolveOllaId(tenantId, request)

    if (!ollaId) {
      response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
      return
    }

    const doc = await uploadMobileDocument(tenantId, ollaId, {
      documentType: request.body.documentType,
      title: request.body.title,
      fileUrl: request.body.fileUrl,
      description: request.body.description,
      uploadedBy: request.user!.userId,
    })

    response.status(201).json({ ok: true, item: doc })
  } catch (error) {
    handleMobileError(error, response)
  }
})

export { mobileRouter }
