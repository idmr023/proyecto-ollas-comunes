'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
const IS_DEV = process.env.NODE_ENV !== 'production'
const MAX_RETRIES = 3

interface CaptchaWidgetProps {
  onToken: (token: string) => void
  onExpire?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        action?: string
        'data-action'?: string
        callback: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function CaptchaWidget({ onToken, onExpire }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const retryCountRef = useRef(0)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      action: 'turnstile-spin-v1',
      callback: (token: string) => {
        setError(false)
        setLoading(false)
        onToken(token)
      },
      'expired-callback': () => {
        widgetIdRef.current = null
        setLoading(true)
        onExpire?.()
      },
      'error-callback': () => {
        retryCountRef.current += 1
        if (retryCountRef.current < MAX_RETRIES) {
          console.warn(`[captcha] Error, reintentando ${retryCountRef.current}/${MAX_RETRIES}`)
          setTimeout(() => {
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current)
            } else {
              renderWidget()
            }
          }, 1500)
        } else {
          console.error('[captcha] Max retries alcanzado')
          setError(true)
          setLoading(false)
          if (IS_DEV) {
            console.warn('[captcha] Modo dev: token de bypass enviado')
            onToken('dev-bypass-token')
          }
        }
      },
      theme: 'auto',
    })
  }, [onToken, onExpire])

  const manualRetry = useCallback(() => {
    setError(false)
    setLoading(true)
    retryCountRef.current = 0
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    } else {
      renderWidget()
    }
  }, [renderWidget])

  useEffect(() => {
    if (!SITE_KEY) {
      console.warn('[captcha] NEXT_PUBLIC_TURNSTILE_SITE_KEY no configurada')
      if (IS_DEV) {
        console.warn('[captcha] Modo dev: token de bypass enviado')
        onToken('dev-bypass-token')
      }
      return
    }
    if (document.querySelector('script[src*="turnstile"]')) {
      renderWidget()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = renderWidget
    script.onerror = () => {
      if (IS_DEV) {
        console.warn('[captcha] No se pudo cargar Turnstile. Modo dev: bypass')
        onToken('dev-bypass-token')
      } else {
        setError(true)
        setLoading(false)
      }
    }
    document.head.appendChild(script)
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [renderWidget, onToken])

  if (!SITE_KEY) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-700">
        Captcha no configurado — agrega NEXT_PUBLIC_TURNSTILE_SITE_KEY
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          No se pudo cargar la verificación
        </div>
        <button
          type="button"
          onClick={manualRetry}
          className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando verificación...
        </div>
      )}
    </div>
  )
}