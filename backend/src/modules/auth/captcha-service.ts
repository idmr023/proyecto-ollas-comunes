import { withRetry, withCircuitBreaker } from '../../lib/retry'

const WORKER_URL = process.env.TURNSTILE_WORKER_URL ?? ''
const DIRECT_SECRET = process.env.TURNSTILE_SECRET_KEY
const DEV_BYPASS = process.env.CAPTCHA_DEV_BYPASS === 'true'
const IS_DEV = process.env.NODE_ENV !== 'production'

export interface CaptchaVerifyResult {
  success: boolean
  errorCodes?: string[]
}

async function verifyWithWorker(token: string): Promise<CaptchaVerifyResult> {
  const res = await fetch(`${WORKER_URL}/siteverify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: token }),
  })
  const data = (await res.json()) as any
  return {
    success: data.success === true,
    errorCodes: data['error-codes'],
  }
}

async function verifyDirect(token: string): Promise<CaptchaVerifyResult> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: DIRECT_SECRET, response: token }),
  })
  const data = (await res.json()) as any
  return {
    success: data.success === true,
    errorCodes: data['error-codes'],
  }
}

export async function verifyCaptcha(token: string): Promise<CaptchaVerifyResult> {
  if (DEV_BYPASS || (IS_DEV && !token)) {
    console.warn('[captcha] Modo desarrollo: captcha omitido')
    return { success: true }
  }

  try {
    if (WORKER_URL) {
      return await withCircuitBreaker('turnstile-worker', () =>
        withRetry(() => verifyWithWorker(token), {
          onRetry: (attempt, err) =>
            console.warn(`[captcha] Worker retry ${attempt}:`, err),
        }),
      )
    }

    if (!DIRECT_SECRET) {
      console.warn('[captcha] TURNSTILE_SECRET_KEY no configurada — captcha omitido')
      return { success: true }
    }

    return await withRetry(() => verifyDirect(token), {
      onRetry: (attempt, err) =>
        console.warn(`[captcha] Direct retry ${attempt}:`, err),
    })
  } catch (err) {
    console.error('[captcha] Error al verificar captcha:', err)
    if (IS_DEV) {
      console.warn('[captcha] Modo desarrollo: bypass por error de red')
      return { success: true }
    }
    return { success: false, errorCodes: ['network-error'] }
  }
}
