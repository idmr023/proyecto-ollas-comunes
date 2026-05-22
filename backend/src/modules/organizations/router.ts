import { Router } from 'express'

import { OrganizationServiceError } from './errors'
import {
  createOrganization,
  getOrganizationBySlug,
  listOrganizations,
  updateOrganizationBySlug,
  updateOrganizationStatusBySlug,
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
