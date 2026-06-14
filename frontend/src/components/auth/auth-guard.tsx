'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { getMeRequest } from '@/lib/auth-api'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isInitialized, token, setAuth, clearAuth, setInitialized } =
    useAuthStore()

  useEffect(() => {
    if (isInitialized) return

    async function validateToken() {
      const stored = useAuthStore.getState()
      if (stored.token && stored.isAuthenticated) {
        try {
          const res = await getMeRequest(stored.token)
          if (res.ok && res.user) {
            setAuth(res.user, stored.token)
          } else {
            clearAuth()
            router.replace('/login')
          }
        } catch {
          // Network error (offline): keep current session alive
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
