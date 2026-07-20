import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodSchema } from 'zod'

/**
 * Valida el cuerpo de la peticion contra un esquema Zod antes de que llegue al
 * servicio, y reemplaza `request.body` por el valor ya parseado y tipado.
 *
 * Ganancia frente a validar dentro de cada servicio: el rechazo ocurre en el
 * borde, de forma uniforme, y ningun campo no declarado sobrevive al parseo.
 */
export function validate(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const first = error.errors[0]
        const path = first?.path.join('.')
        response.status(400).json({
          ok: false,
          message: path
            ? `${path}: ${first?.message}`
            : (first?.message ?? 'Datos de entrada invalidos.'),
        })
        return
      }
      next(error)
    }
  }
}
