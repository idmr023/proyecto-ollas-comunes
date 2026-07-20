import { z } from 'zod'

/**
 * Respaldo de una mutacion que fallo en el cliente offline.
 *
 * `body` se guarda tal cual en la base, asi que se acota su tamano: sin limite,
 * cualquier usuario autenticado podria engordar la tabla a voluntad.
 */
export const backupMutationSchema = z
  .object({
    path: z.string().trim().min(1, 'La ruta es obligatoria.').max(500),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    body: z.unknown().optional(),
    errorMessage: z.string().max(2000).optional(),
    status: z.number().int().min(100).max(599).optional(),
    originalTimestamp: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (value) => JSON.stringify(value.body ?? null).length <= 100_000,
    { message: 'El cuerpo respaldado excede el tamano permitido.', path: ['body'] },
  )

/**
 * Aviso de perdida de datos en un cliente offline.
 *
 * Dispara un correo a los administradores, de modo que `message` se acota y se
 * limpian los saltos de linea: sin ello el campo permite inyectar contenido
 * arbitrario en el cuerpo del correo.
 */
export const reportDataLossSchema = z
  .object({
    pendingCount: z.number().int().nonnegative().max(1_000_000),
    failedCount: z.number().int().nonnegative().max(1_000_000),
    message: z
      .string()
      .trim()
      .min(1, 'El mensaje es obligatorio.')
      .max(1000, 'Mensaje demasiado largo.')
      .transform((value) => value.replace(/[\r\n]+/g, ' ')),
  })
  .strict()
