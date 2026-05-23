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

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido.')
    .max(255, 'Email demasiado largo.'),
  password: z
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres.')
    .max(128, 'Contrasena demasiado larga.'),
  fullName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(150, 'Nombre demasiado largo.'),
  tenantId: z.string().uuid('Tenant invalido.'),
  role: z.enum(['admin_municipal', 'lideresa_olla', 'supervisor']).optional(),
})

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

export const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Codigo de autorizacion requerido.'),
})

export const googleCredentialSchema = z.object({
  credential: z.string().min(1, 'Credencial de Google requerida.'),
})
