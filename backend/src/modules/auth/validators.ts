import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(1, 'El nombre es requerido').max(150),
  tenantId: z.string().min(1, 'El tenant es requerido'),
  role: z.string().optional(),
})

export const verifyOtpSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  tempToken: z.string().min(1, 'El token temporal es requerido. Vuelve a iniciar sesión.'),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos'),
})
