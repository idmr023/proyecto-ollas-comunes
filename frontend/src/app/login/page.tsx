'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/login/login-form'
import { useAuthStore } from '@/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/workspace/home')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return <LoginForm />
}
