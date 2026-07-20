import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido.')
    .max(255, 'Email demasiado largo.'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria.')
    .max(128, 'Contrasena demasiado larga.'),
})

export const totpSetupSchema = z.object({
  tempToken: z.string().min(1, 'Token temporal requerido.'),
})

/**
 * Politica de contrasenas para cuentas nuevas.
 *
 * 12 caracteres es el minimo recomendado actual. NO se aplica a `loginSchema`:
 * las cuentas creadas bajo la politica anterior deben poder seguir entrando, y
 * exigir aqui la nueva longitud solo delataria que la contrasena es antigua.
 */
export const passwordSchema = z
  .string()
  .min(12, 'La contrasena debe tener al menos 12 caracteres.')
  .max(128, 'Contrasena demasiado larga.')
  .refine((value) => /[a-z]/.test(value), {
    message: 'La contrasena debe incluir al menos una minuscula.',
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: 'La contrasena debe incluir al menos una mayuscula.',
  })
  .refine((value) => /\d/.test(value), {
    message: 'La contrasena debe incluir al menos un numero.',
  })
  .refine((value) => !/^(.)\1+$/.test(value), {
    message: 'La contrasena no puede ser un unico caracter repetido.',
  })

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido.')
    .max(255, 'Email demasiado largo.'),
  password: passwordSchema,
  fullName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(150, 'Nombre demasiado largo.'),
  role: z.enum(['admin_municipal', 'lideresa_olla', 'supervisor']).optional(),
  // Olla a cargo. Obligatoria para `lideresa_olla` (lo exige el servicio, que
  // ademas comprueba que pertenezca a la organizacion del solicitante): sin
  // ella la cuenta nace sin acceso a ningun dato.
  ollaId: z.string().uuid('Olla invalida.').optional(),
})
  // `strict` hace que un `tenantId` en el cuerpo falle de forma visible en vez
  // de ignorarse en silencio: el tenant se deriva siempre del token.
  .strict('Campo no permitido en el alta de usuario.')

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido.')
    .max(255, 'Email demasiado largo.'),
  tempToken: z.string().min(1, 'Token temporal requerido.'),
  code: z
    .string()
    .regex(/^\d{6}$/, 'El codigo debe tener exactamente 6 digitos.'),
})
