import { Router, Response } from 'express'
import { BeneficiaryServiceError } from './errors'
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  getHealthConditions,
  getTenantOllas,
  registerBeneficiary,
  removeBeneficiary,
  updateBeneficiary,
} from './service'

const beneficiariesRouter = Router()

function handleError(error: unknown, response: Response) {
  if (error instanceof BeneficiaryServiceError) {
    response.status(error.statusCode).json({ ok: false, message: error.message })
    return
  }
  console.error('[beneficiaries] Error inesperado:', error)
  response.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    ...(process.env.NODE_ENV !== 'production' ? { detail: String(error) } : {}),
  })
}

beneficiariesRouter.get('/', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const query = typeof request.query.query === 'string' ? request.query.query : undefined
    const ollaId = typeof request.query.ollaId === 'string' ? request.query.ollaId : undefined
    const rawHealthConditionId = request.query.healthConditionId
    const healthConditionId = typeof rawHealthConditionId === 'string' ? Number(rawHealthConditionId) : undefined

    const items = await getAllBeneficiaries(tenantId, {
      query,
      ollaId,
      healthConditionId: healthConditionId && !Number.isNaN(healthConditionId) ? healthConditionId : undefined,
    })

    response.json({ ok: true, items })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.get('/conditions', async (_request, response) => {
  try {
    const items = await getHealthConditions()
    response.json({ ok: true, items })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.get('/ollas', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const items = await getTenantOllas(tenantId)
    response.json({ ok: true, items })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.get('/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const item = await getBeneficiaryById(request.params.id, tenantId)
    response.json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.post('/', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const item = await registerBeneficiary(tenantId, request.body)
    response.status(201).json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.patch('/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const item = await updateBeneficiary(request.params.id, tenantId, request.body)
    response.json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.delete('/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const result = await removeBeneficiary(request.params.id, tenantId)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

export { beneficiariesRouter }
