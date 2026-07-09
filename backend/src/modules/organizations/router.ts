import { Router } from 'express'

import { OrganizationServiceError } from './errors'
import {
  createOrganization,
  getOrganizationBySlug,
  listOrganizations,
  updateOrganizationBySlug,
  updateOrganizationStatusBySlug,
  getAdminDashboard,
  getTenantInventoryStock,
  getTenantInventoryMovements,
  getTenantAlerts,
  updateTenantAlert,
} from './service'
import { createOlla, listOllasByTenantId } from '../ollas-comunes/service'
import { OllaServiceError } from '../ollas-comunes/errors'

const organizationsRouter = Router()

function handleOrganizationError(
  error: unknown,
  response: import('express').Response,
) {
  if (error instanceof OrganizationServiceError || error instanceof OllaServiceError) {
    response.status(error.statusCode).json({
      ok: false,
      message: error.message,
    })
    return
  }

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

  response.status(500).json({
    ok: false,
    message: 'No se pudo procesar la solicitud de organizaciones.',
  })
}

organizationsRouter.get('/', async (_request, response) => {
  try {
    const organizations = await listOrganizations()
    response.json({
      ok: true,
      items: organizations,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.get('/dashboard/stats', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const data = await getAdminDashboard(tenantId)
    response.json({ ok: true, ...data })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.get('/inventory/stock', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const items = await getTenantInventoryStock(tenantId)
    response.json({ ok: true, items })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.get('/inventory/movements', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const items = await getTenantInventoryMovements(tenantId)
    response.json({ ok: true, items })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.get('/alerts', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const items = await getTenantAlerts(tenantId)
    response.json({ ok: true, items })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.patch('/alerts/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const { status } = request.body
    if (!status || typeof status !== 'string') {
      response.status(400).json({ ok: false, message: 'Estado inválido o faltante.' })
      return
    }
    const item = await updateTenantAlert(request.params.id, tenantId, status)
    response.json({ ok: true, item })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.get('/:slug', async (request, response) => {
  try {
    const organization = await getOrganizationBySlug(request.params.slug)
    response.json({
      ok: true,
      item: organization,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.post('/', async (request, response) => {
  try {
    const organization = await createOrganization(request.body)
    response.status(201).json({
      ok: true,
      item: organization,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.patch('/:slug', async (request, response) => {
  try {
    const organization = await updateOrganizationBySlug(
      request.params.slug,
      request.body,
    )
    response.json({
      ok: true,
      item: organization,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.patch('/:slug/status', async (request, response) => {
  try {
    const organization = await updateOrganizationStatusBySlug(
      request.params.slug,
      request.body?.status,
    )
    response.json({
      ok: true,
      item: organization,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

// --- Ollas Comunes (nested under organizations) ---

organizationsRouter.get('/:slug/ollas', async (request, response) => {
  try {
    const tenant = await getOrganizationBySlug(request.params.slug)
    const ollas = await listOllasByTenantId(tenant.id)
    response.json({ ok: true, items: ollas })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.post('/:slug/ollas', async (request, response) => {
  try {
    const tenant = await getOrganizationBySlug(request.params.slug)
    const olla = await createOlla(tenant.id, request.body)
    response.status(201).json({ ok: true, item: olla })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

export { organizationsRouter }
