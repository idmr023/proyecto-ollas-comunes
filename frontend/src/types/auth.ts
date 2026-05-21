export interface User {
  id: string
  email: string
  fullName: string
  role: string
  tenantId: string
  tenantName: string
}

export interface JWTPayload {
  userId: string
  email: string
  tenantId: string
  role: string
  fullName: string
  exp: number
  iat: number
}

export interface AuthResponse {
  ok: boolean
  token?: string
  user?: User
  message?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
  tenantId: string
  role?: string
}

export interface UpdateUserInput {
  fullName?: string
  email?: string
}
