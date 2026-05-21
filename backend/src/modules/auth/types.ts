export type UserRole = 'admin_municipal' | 'lideresa_olla' | 'supervisor'

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

export interface AuthTokens {
  token: string
  expiresIn: number
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
