import { z } from 'zod'

/**
 * Estados de alerta admitidos, antes validados solo como `typeof === 'string'`.
 * `open` es el valor por defecto del esquema Prisma; el frontend emite
 * `resolved` y `dismissed`.
 */
export const updateAlertSchema = z
  .object({
    status: z.enum(['open', 'pending', 'in_review', 'resolved', 'dismissed'], {
      errorMap: () => ({ message: 'Estado de alerta invalido.' }),
    }),
  })
  .strict()

export const organizationPayloadSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(150),
    category: z.string().trim().min(1, 'La categoria es obligatoria.').max(100),
    location: z.string().trim().min(1, 'La ubicacion es obligatoria.').max(100),
  })
  .strict()

export const organizationStatusSchema = z
  .object({
    status: z.string().trim().min(1, 'Estado invalido o faltante.').max(50),
  })
  .strict()
