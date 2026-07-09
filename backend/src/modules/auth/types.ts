export type UserRole = 'admin_municipal' | 'lideresa_olla' | 'supervisor' | 'operador_olla' | 'coordinador'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
  tenantId: string
  role?: UserRole
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  tenantId: string
  tenantName: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

export interface MfaPendingResponse {
  status: 'MFA_PENDING'
  tempToken: string
  email: string
}

/**
 * Primer paso del setup TOTP. /login devuelve esto cuando el usuario NO tiene
 * aún un secret configurado. NO incluye el secret ni el QR — esos se obtienen
 * en el segundo paso llamando a /api/auth/totp/setup, de modo que el secret
 * solo se persiste en BD cuando el frontend ya esta listo para mostrarlo.
 */
export interface TotpSetupRequiredResponse {
  status: 'TOTP_SETUP_REQUIRED'
  tempToken: string
  email: string
}

/**
 * Segundo paso del setup TOTP. Aqui SI se persiste el secret en BD.
 * Es idempotente: si el usuario ya tiene secret, devuelve el mismo.
 */
export interface TotpSetupInput {
  tempToken: string
}

export interface TotpSetupResponse {
  secret: string
  qrCodeUri: string
  email: string
}

export interface VerifyOtpInput {
  email: string
  tempToken: string
  code: string
}
