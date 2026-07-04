export type UserRole = 'admin_municipal' | 'lideresa_olla' | 'supervisor' | 'operador_olla' | 'coordinador'

export interface LoginInput {
  email: string
  password: string
  captchaToken?: string
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

export interface TotpSetupRequiredResponse {
  status: 'TOTP_SETUP_REQUIRED'
  tempToken: string
  secret: string
  qrCodeUri: string
  email: string
}

export interface CaptchaRequiredResponse {
  status: 'CAPTCHA_REQUIRED'
  email: string
}

export interface VerifyOtpInput {
  email: string
  tempToken: string
  code: string
}
