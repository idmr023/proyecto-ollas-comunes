import { AuthResponse, LoginCredentials, RegisterInput } from '@/types/auth'
import { apiFetch } from './http'

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
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
  const response = await apiFetch('/api/auth/totp/setup', {
    method: 'POST',
    body: JSON.stringify({ tempToken }),
  })

  return response.json()
}

/**
 * Verifica el codigo TOTP. En la respuesta el backend emite la cookie de sesion
 * `httpOnly`; el token que llega en el cuerpo se ignora deliberadamente para
 * que nunca quede en un almacen accesible desde JavaScript.
 */
export async function verifyOtpRequest(input: {
  email: string
  tempToken: string
  code: string
}): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return response.json()
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Cerrar sesion no debe fallar de cara al usuario: el estado local se
    // limpia igualmente aunque la red falle.
  }
}

/** La sesion va en la cookie, por eso ya no recibe el token como argumento. */
export async function getMeRequest(): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/me')
  return response.json()
}

/**
 * Alta de un usuario dentro de la organizacion del administrador que la invoca.
 * Requiere sesion con rol administrativo; el backend deriva el tenant de la
 * cookie y no abre sesion para el usuario creado.
 */
export async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return response.json()
}

export async function updateProfileRequest(
  input: { fullName?: string; currentPassword?: string; newPassword?: string }
): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })

  return response.json()
}
