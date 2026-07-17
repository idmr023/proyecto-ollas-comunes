'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isInitialized, setAuth, clearAuth, setInitialized } =
    useAuthStore()

  useEffect(() => {
    if (isInitialized) return

    async function validateToken() {
      const stored = useAuthStore.getState()
      if (stored.token && stored.isAuthenticated) {
        if (isTokenExpired(stored.token)) {
          clearAuth()
          setInitialized(true)
          router.replace('/login')
          return
        }
        try {
          const res = await getMeRequest(stored.token)
          if (res.ok && res.user) {
            setAuth(res.user, stored.token)
          } else {
            clearAuth()
            setInitialized(true)
            router.replace('/login')
          }
        } catch {
          setInitialized(true)
        }
      } else {
        setInitialized(true)
      }
    }

    validateToken()
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
