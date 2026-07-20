import { Router } from 'express'

import { requireRole } from '../../lib/middleware/auth'
import { validate } from '../../lib/middleware/validate'
import { PERMISSIONS } from '../../lib/permissions'
import { OrganizationServiceError } from './errors'
import {
  organizationPayloadSchema,
  organizationStatusSchema,
  updateAlertSchema,
} from './validators'
import {
  createOrganization,
  getOrganizationForTenant,
  listOrganizationsForTenant,
  updateOrganizationForTenant,
  updateOrganizationStatusForTenant,
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

organizationsRouter.get('/', async (request, response) => {
  try {
    const organizations = await listOrganizationsForTenant(request.user!.tenantId)
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

organizationsRouter.patch(
  '/alerts/:id',
  requireRole(...PERMISSIONS.alerts.update),
  validate(updateAlertSchema),
  async (request, response) => {
    try {
      const tenantId = request.user!.tenantId
      const item = await updateTenantAlert(
        String(request.params.id),
        tenantId,
        request.body.status,
      )
      response.json({ ok: true, item })
    } catch (error) {
      handleOrganizationError(error, response)
    }
  },
)

organizationsRouter.get('/:slug', async (request, response) => {
  try {
    const organization = await getOrganizationForTenant(
      request.params.slug,
      request.user!.tenantId,
    )
    response.json({
      ok: true,
      item: organization,
    })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.post('/', requireRole(...PERMISSIONS.organizations.create), validate(organizationPayloadSchema), async (request, response) => {
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

organizationsRouter.patch(
  '/:slug',
  requireRole(...PERMISSIONS.organizations.update),
  validate(organizationPayloadSchema),
  async (request, response) => {
    try {
      const organization = await updateOrganizationForTenant(
        String(request.params.slug),
        request.user!.tenantId,
        request.body,
      )
      response.json({
        ok: true,
        item: organization,
      })
    } catch (error) {
      handleOrganizationError(error, response)
    }
  },
)

organizationsRouter.patch(
  '/:slug/status',
  requireRole(...PERMISSIONS.organizations.changeStatus),
  validate(organizationStatusSchema),
  async (request, response) => {
    try {
      const organization = await updateOrganizationStatusForTenant(
        String(request.params.slug),
        request.user!.tenantId,
        request.body?.status,
      )
      response.json({
        ok: true,
        item: organization,
      })
    } catch (error) {
      handleOrganizationError(error, response)
    }
  },
)

// --- Ollas Comunes (nested under organizations) ---

organizationsRouter.get('/:slug/ollas', async (request, response) => {
  try {
    const tenant = await getOrganizationForTenant(
      request.params.slug,
      request.user!.tenantId,
    )
    const ollas = await listOllasByTenantId(tenant.id)
    response.json({ ok: true, items: ollas })
  } catch (error) {
    handleOrganizationError(error, response)
  }
})

organizationsRouter.post(
  '/:slug/ollas',
  requireRole(...PERMISSIONS.ollas.create),
  async (request, response) => {
    try {
      const tenant = await getOrganizationForTenant(
        String(request.params.slug),
        request.user!.tenantId,
      )
      const olla = await createOlla(tenant.id, request.body)
      response.status(201).json({ ok: true, item: olla })
    } catch (error) {
      handleOrganizationError(error, response)
    }
  },
)

export { organizationsRouter }
