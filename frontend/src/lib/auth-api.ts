import { AuthResponse, LoginCredentials, RegisterInput } from '@/types/auth'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  return response.json()
}

/**
 * Segundo paso del setup TOTP. El backend persiste el secret en BD aqui
 * (no en /login), de modo que si el usuario solo llega a /login sin llamar
 * a /totp/setup, la BD no queda mutada.
 */
export async function setupTotpRequest(tempToken: string): Promise<{
  secret: string
  qrCodeUri: string
  email: string
}> {
  const response = await fetch(`${apiBaseUrl}/api/auth/totp/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken }),
  })

  return response.json()
}

export async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return response.json()
}

export async function getMeRequest(token: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export async function updateProfileRequest(
  token: string,
  input: { fullName?: string; currentPassword?: string; newPassword?: string }
): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  return response.json()
}
