'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { getMeRequest } from '@/lib/auth-api'

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
      getMeRequest(stored.token)
        .then((res) => {
          if (res.ok && res.user) {
            setAuth(res.user, stored.token!)
          } else {
            clearAuth()
          }
        })
        .catch(() => {
          // Network error (offline): keep current session alive
          setInitialized(true)
        })
    } else {
      setInitialized(true)
    }
  }, [setAuth, clearAuth, setInitialized])

  return <>{children}</>
}
