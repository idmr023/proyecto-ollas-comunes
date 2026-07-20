import { z } from 'zod'

const uuid = z.string().uuid('Identificador invalido.')

export const createMovementSchema = z
  .object({
    supplyItemId: uuid,
    movementType: z.enum(['in', 'out', 'adjustment', 'waste']),
    quantity: z.coerce.number().positive('La cantidad debe ser un numero positivo.'),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict()

export const mealDeliverySchema = z
  .object({
    beneficiaryIds: z
      .array(uuid)
      .min(1, 'La lista de beneficiarios no puede estar vacia.')
      .max(1000, 'Demasiados beneficiarios en una sola entrega.'),
    totalRations: z.coerce.number().int().positive().optional(),
    dishName: z.string().trim().max(200).optional(),
  })
  .strict()

export const menuPlanExecutionSchema = z
  .object({
    dishName: z.string().trim().min(1, 'El nombre del plato es obligatorio.').max(200),
    servings: z.coerce.number().int().positive('La cantidad de raciones debe ser positiva.'),
    recipeId: uuid.optional(),
    recipeIngredients: z
      .array(
        z.object({
          supplyItemId: uuid,
          quantity: z.coerce.number().positive(),
        }),
      )
      .max(200)
      .optional(),
  })
  .strict()

/** ~5 MB de binario, que en base64 ocupan ~6.8 MB de texto. */
const MAX_BASE64_LENGTH = 7_000_000

export const uploadDocumentSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1, 'El nombre de archivo es obligatorio.')
      .max(255)
      // Sin esto, un nombre como "../../x" escaparia del directorio destino.
      .refine((value) => !value.includes('/') && !value.includes('\\') && !value.includes('..'), {
        message: 'El nombre de archivo contiene caracteres no permitidos.',
      }),
    fileType: z.string().trim().max(100).optional(),
    documentType: z.string().trim().min(1, 'El tipo de documento es obligatorio.').max(100),
    title: z.string().trim().min(1, 'El titulo es obligatorio.').max(200),
    description: z.string().trim().max(2000).optional(),
    base64Data: z
      .string()
      .min(1, 'El contenido del archivo es obligatorio.')
      .max(MAX_BASE64_LENGTH, 'El archivo excede el tamano maximo permitido.'),
  })
  .strict()
