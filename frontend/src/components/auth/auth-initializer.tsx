'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { getMeRequest } from '@/lib/auth-api'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const ran = useRef(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setInitialized = useAuthStore((s) => s.setInitialized)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const stored = useAuthStore.getState()

    if (stored.token && stored.isAuthenticated) {
      if (isTokenExpired(stored.token)) {
        clearAuth()
        document.cookie = "sigo_session=; path=/; max-age=0"
        setInitialized(true)
        return
      }
      getMeRequest(stored.token)
        .then((res) => {
          if (res.ok && res.user) {
            setAuth(res.user, stored.token!)
          } else {
            clearAuth()
            document.cookie = "sigo_session=; path=/; max-age=0"
            setInitialized(true)
          }
        })
        .catch(() => {
          setInitialized(true)
        })
    } else {
      setInitialized(true)
    }
  }, [setAuth, clearAuth, setInitialized])

  return <>{children}</>
}
