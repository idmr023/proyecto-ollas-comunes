"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { BottomNav } from "@/components/mobile/bottom-nav"

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) router.replace("/login")
  }, [token, router])

  if (!token) return null

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 shadow-xl">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
