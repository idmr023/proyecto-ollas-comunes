'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { getMeRequest } from '@/lib/auth-api'

/**
 * Segunda linea de defensa, por detras de `proxy.ts`.
 *
 * `proxy.ts` decide en el servidor si la pagina llega a renderizarse; esto solo
 * hidrata el usuario en el store y reacciona si la sesion ya no es valida. Ya
 * no inspecciona el JWT: la cookie es `httpOnly` y no se puede leer desde
 * JavaScript, asi que quien dice si la sesion sigue viva es `/api/auth/me`.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized } =
    useAuthStore()

  useEffect(() => {
    if (isInitialized) return

    async function validateSession() {
      try {
        const res = await getMeRequest()
        if (res.ok && res.user) {
          setAuth(res.user)
          return
        }
        clearAuth()
        setInitialized(true)
        router.replace('/login')
      } catch {
        // Fallo de red: no se cierra la sesion, porque el modo offline de la
        // PWA depende de poder seguir mostrando la interfaz.
        setInitialized(true)
      }
    }

    validateSession()
  }, [isInitialized, router, setAuth, clearAuth, setInitialized])

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isInitialized, isAuthenticated, router])

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
