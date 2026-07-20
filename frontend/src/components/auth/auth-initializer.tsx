'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { getMeRequest } from '@/lib/auth-api'

/**
 * Rehidrata el usuario al arrancar la aplicacion.
 *
 * Ya no inspecciona la expiracion del JWT en el cliente: la sesion vive en una
 * cookie `httpOnly` ilegible desde JavaScript. Quien decide si sigue siendo
 * valida es `/api/auth/me`, que ademas verifica la firma en el servidor en
 * lugar de fiarse del campo `exp` decodificado en el navegador.
 */
export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const ran = useRef(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setInitialized = useAuthStore((s) => s.setInitialized)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const stored = useAuthStore.getState()

    // `isAuthenticated` es solo una pista de UI persistida; sin ella no hay
    // motivo para gastar una peticion.
    if (!stored.isAuthenticated) {
      setInitialized(true)
      return
    }

    getMeRequest()
      .then((res) => {
        if (res.ok && res.user) {
          setAuth(res.user)
        } else {
          clearAuth()
          setInitialized(true)
        }
      })
      .catch(() => {
        // Sin red no se cierra la sesion: la PWA debe seguir siendo usable.
        setInitialized(true)
      })
  }, [setAuth, clearAuth, setInitialized])

  return <>{children}</>
}
