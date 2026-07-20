import { Router, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { debugDetail } from '../../lib/debug'
import { mobileRepository } from '../mobile/repository'
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

  // Interceptar errores conocidos de Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const err = error as { code: string; message?: string }
    if (err.code === 'P2002') {
      response.status(409).json({
        ok: false,
        message: 'Conflicto: Ya existe un registro con valores duplicados para un campo único (DNI u otro).',
      })
      return
    }
    if (err.code === 'P2003') {
      response.status(400).json({
        ok: false,
        message: 'Error de integridad: La operación hace referencia a un elemento que no existe (clave foránea no válida).',
      })
      return
    }
    if (err.code === 'P2025') {
      response.status(404).json({
        ok: false,
        message: 'No encontrado: El registro solicitado para actualizar o eliminar no existe.',
      })
      return
    }
  }

  console.error('[beneficiaries] Error inesperado:', error)
  response.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    ...debugDetail(error),
  })
}

beneficiariesRouter.get('/', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId
    const query = typeof request.query.query === 'string' ? request.query.query : undefined
    let ollaId = typeof request.query.ollaId === 'string' ? request.query.ollaId : undefined
    const rawHealthConditionId = request.query.healthConditionId
    const healthConditionId = typeof rawHealthConditionId === 'string' ? Number(rawHealthConditionId) : undefined

    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      if (!olla) {
        response.json({ ok: true, items: [] })
        return
      }
      ollaId = olla.id
    }

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
    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      if (!olla) {
        response.json({ ok: true, items: [] })
        return
      }
      response.json({ ok: true, items: [{ id: olla.id, name: olla.name }] })
      return
    }
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

    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      // Sin olla asignada se deniega. Comparar contra `olla?.id` dejaba pasar a
      // un beneficiario sin olla, porque `undefined === undefined`.
      if (!olla || item.ollaId !== olla.id) {
        response.status(403).json({ ok: false, message: 'No tienes permisos para ver este beneficiario.' })
        return
      }
    }

    response.json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.post('/', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId

    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      if (!olla) {
        response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
        return
      }
      request.body.ollaId = olla.id
    } else {
      if (request.body.ollaId) {
        const ollaExist = await prisma.ollaComun.findFirst({
          where: { id: request.body.ollaId, tenantId }
        })
        if (!ollaExist) {
          response.status(400).json({ ok: false, message: 'La olla común especificada no pertenece a tu organización.' })
          return
        }
      }
    }

    const item = await registerBeneficiary(tenantId, request.body)
    response.status(201).json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.patch('/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId

    const beneficiary = await getBeneficiaryById(request.params.id, tenantId)

    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      if (!olla) {
        response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
        return
      }
      if (beneficiary.ollaId !== olla.id) {
        response.status(403).json({ ok: false, message: 'No tienes permisos para modificar este beneficiario.' })
        return
      }
      request.body.ollaId = olla.id
    } else {
      if (request.body.ollaId) {
        const ollaExist = await prisma.ollaComun.findFirst({
          where: { id: request.body.ollaId, tenantId }
        })
        if (!ollaExist) {
          response.status(400).json({ ok: false, message: 'La olla común especificada no pertenece a tu organización.' })
          return
        }
      }
    }

    const item = await updateBeneficiary(request.params.id, tenantId, request.body)
    response.json({ ok: true, item })
  } catch (error) {
    handleError(error, response)
  }
})

beneficiariesRouter.delete('/:id', async (request, response) => {
  try {
    const tenantId = request.user!.tenantId

    const beneficiary = await getBeneficiaryById(request.params.id, tenantId)

    if (request.user!.role === 'lideresa_olla') {
      const olla = await mobileRepository.getUserOlla(request.user!.userId)
      if (!olla) {
        response.status(403).json({ ok: false, message: 'No tienes una olla activa asignada.' })
        return
      }
      if (beneficiary.ollaId !== olla.id) {
        response.status(403).json({ ok: false, message: 'No tienes permisos para eliminar este beneficiario.' })
        return
      }
    }

    const result = await removeBeneficiary(request.params.id, tenantId)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

export { beneficiariesRouter }
