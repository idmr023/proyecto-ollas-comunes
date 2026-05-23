import { AuthError } from './errors'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const GOOGLE_REDIRECT_URL =
  process.env.GOOGLE_REDIRECT_URL ?? 'http://localhost:4000/api/auth/google/callback'

export function getGoogleOAuthUrl(): string {
  if (!SUPABASE_URL) {
    throw new AuthError(500, 'SUPABASE_URL no esta configurada para OAuth.')
  }

  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: GOOGLE_REDIRECT_URL,
    scopes: 'email profile',
  })

  return `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`
}

export interface GoogleUserInfo {
  email: string
  fullName: string
  googleId: string
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  if (!SUPABASE_URL) {
    throw new AuthError(500, 'SUPABASE_URL no esta configurada para OAuth.')
  }

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SECRET_KEY ?? '',
      },
      body: JSON.stringify({
        code,
        redirect_uri: GOOGLE_REDIRECT_URL,
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new AuthError(401, `Error al intercambiar codigo Google: ${body}`)
  }

  const data = (await response.json()) as {
    user?: { email?: string; user_metadata?: Record<string, unknown>; id?: string }
    error?: string
  }

  if (!data.user) {
    throw new AuthError(401, 'Google no retorno informacion del usuario.')
  }

  const email = data.user.email ?? ''
  const fullName =
    (data.user.user_metadata?.full_name as string) ??
    (data.user.user_metadata?.name as string) ??
    email.split('@')[0]
  const googleId = data.user.id ?? ''

  if (!email) {
    throw new AuthError(400, 'Google no proporciono un email valido.')
  }

  return { email, fullName, googleId }
}
