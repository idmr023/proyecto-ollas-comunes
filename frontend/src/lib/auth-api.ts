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
