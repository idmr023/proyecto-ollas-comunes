"use client"

import { useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

interface ApiOptions extends RequestInit {
  params?: Record<string, string>
}
/**
 * Hook personalizado que inyecta automáticamente el JWT desde auth-store
 * y maneja errores de red con mensajes amigables.
 * Sustituye a los lib/*-api.ts individuales en la experiencia mobile.
 */
export function useApi() {
  const token = useAuthStore((s) => s.token)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const request = useCallback(
    async <T = unknown>(endpoint: string, opts: ApiOptions = {}): Promise<T> => {
      const { params, ...fetchOpts } = opts
      const url = new URL(`${BASE_URL}${endpoint}`)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOpts.headers as Record<string, string>),
      }
      if (token) headers["Authorization"] = `Bearer ${token}`

      try {
        const res = await fetch(url.toString(), { ...fetchOpts, headers })
        if (res.status === 401 && navigator.onLine) {
          clearAuth()
          if (typeof window !== "undefined") window.location.href = "/login"
          throw new Error("Sesión expirada. Ingresa nuevamente.")
        }
        if (res.status === 401) {
          throw new Error("Sin conexión. No se pudo validar la sesión.")
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message ?? body.error ?? `Error ${res.status}`)
        }
        return res.json() as Promise<T>
      } catch (err) {
        if (err instanceof TypeError && err.message === "Failed to fetch") {
          toast.error("Sin conexión. Revisa tu red e intenta de nuevo.")
          throw new Error("Sin conexión al servidor")
        }
        throw err
      }
    },
    [token, clearAuth],
  )

  const get = useCallback(
    <T>(endpoint: string, params?: Record<string, string>) => request<T>(endpoint, { params }),
    [request],
  )

  return { request, get }
}
