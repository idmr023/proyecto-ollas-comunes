"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { BottomNav } from "@/components/mobile/bottom-nav"

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isInitialized, isAuthenticated, router])

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 shadow-xl">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
