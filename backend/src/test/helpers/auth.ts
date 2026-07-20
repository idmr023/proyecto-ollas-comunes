import { generate } from 'otplib'

/**
 * Obtiene un token de sesion recorriendo el flujo real de autenticacion.
 *
 * Antes cada suite tenia su propia copia de esta funcion, y ambas leian el
 * secreto TOTP directamente de `app_users.totp_secret`. Eso dejo de funcionar
 * por dos motivos:
 *
 *  1. `/login` ya no devuelve el secreto. Se separo en dos pasos para no
 *     mutar la base de datos en el login, asi que el secreto solo se obtiene
 *     llamando a `/api/auth/totp/setup` con el token temporal.
 *  2. El secreto se guarda cifrado. Leerlo de la tabla devuelve el texto
 *     cifrado, con el que `generate()` produce un codigo invalido.
 *
 * Recorrer el flujo real resuelve ambos y ademas ejercita el camino que usa
 * el frontend, en lugar de un atajo que solo existia en las pruebas.
 */
export async function authenticate(
  baseUrl: string,
  email = 'admin@ollascomunes.pe',
  password = 'admin123',
): Promise<{ token: string; tenantId: string }> {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const loginData = (await loginRes.json()) as Record<string, any>

  if (!loginRes.ok) {
    throw new Error(`Login fallido (${loginRes.status}): ${loginData.message ?? 'sin detalle'}`)
  }

  // Sesion directa: solo ocurre si el MFA esta deshabilitado.
  if (loginData.token) {
    return { token: loginData.token, tenantId: loginData.user.tenantId }
  }

  if (!loginData.tempToken) {
    throw new Error(`Respuesta de login inesperada: ${JSON.stringify(loginData)}`)
  }

  // Paso 2: obtener el secreto en claro. Es idempotente, asi que sirve tanto
  // para TOTP_SETUP_REQUIRED como para MFA_PENDING.
  const setupRes = await fetch(`${baseUrl}/api/auth/totp/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken: loginData.tempToken }),
  })
  const setupData = (await setupRes.json()) as Record<string, any>

  if (!setupRes.ok || !setupData.secret) {
    throw new Error(`No se pudo obtener el secreto TOTP (${setupRes.status})`)
  }

  const code = await generate({ secret: setupData.secret })

  const verifyRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, tempToken: loginData.tempToken, code }),
  })
  const verifyData = (await verifyRes.json()) as Record<string, any>

  if (!verifyRes.ok || !verifyData.token) {
    throw new Error(`Verificacion OTP fallida (${verifyRes.status}): ${verifyData.message ?? ''}`)
  }

  return { token: verifyData.token, tenantId: verifyData.user.tenantId }
}
