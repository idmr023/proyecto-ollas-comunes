export type UserRole = 'admin_municipal' | 'lideresa_olla' | 'supervisor' | 'operador_olla' | 'coordinador'

export interface LoginInput {
  email: string
  password: string
}

/**
 * El alta de usuarios la realiza un administrador ya autenticado.
 * `tenantId` NO forma parte de la entrada: se deriva siempre del token del
 * solicitante para impedir el alta cruzada entre organizaciones.
 */
export interface RegisterInput {
  email: string
  password: string
  fullName: string
  role?: UserRole
}

/** Identidad del solicitante, tomada del JWT verificado. */
export interface ActorContext {
  tenantId: string
  role: string
}

/** El alta no abre sesion: el usuario creado debe pasar por login + TOTP. */
export interface RegisterResponse {
  user: AuthUser
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
