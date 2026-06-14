"use client"

import { useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { getCache, setCache, addMutation } from "@/lib/indexed-db"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

interface ApiOptions extends RequestInit {
  params?: Record<string, string>
}

// Helper para manejar las mutaciones optimistas fuera del hook
async function handleOfflineMutation<T = unknown>(endpoint: string, opts: RequestInit): Promise<T> {
  const method = (opts.method ?? "POST").toUpperCase() as "POST" | "PATCH" | "DELETE"
  const body = opts.body ? JSON.parse(opts.body as string) : null
  
  // Generar ID temporal si es creación
  const tempId = method === "POST" ? `temp-${Math.floor(100000 + Math.random() * 900000)}` : undefined
  
  console.log("[useApi Offline] Encolando cambio offline en useApi:", method, endpoint, body, "tempId:", tempId)
  
  // Encolar mutación en IndexedDB
  await addMutation(endpoint, method, body, tempId)

  // 1. Manejo optimista de beneficiarios
  if (endpoint.startsWith("/api/beneficiaries")) {
    const cachedList = await getCache<any>("/api/beneficiaries")
    if (cachedList && Array.isArray(cachedList.items)) {
      let updatedItems = [...cachedList.items]
      
      if (method === "POST" && tempId) {
        const mockBeneficiary = {
          id: tempId,
          firstName: body?.firstName ?? "",
          lastName: body?.lastName ?? "",
          fullName: `${body?.firstName ?? ""} ${body?.lastName ?? ""}`.trim(),
          dni: body?.dni ?? "",
          birthDate: body?.birthDate ?? "",
          gender: body?.gender ?? "not_specified",
          phone: body?.phone ?? "",
          address: body?.address ?? "",
          ollaId: body?.ollaId ?? null,
          priorityLevel: body?.priorityLevel ?? "normal",
          status: body?.status ?? "active",
          registeredAt: new Date().toISOString(),
          olla: null,
          healthConditions: (body?.healthConditionIds ?? []).map((id: number) => ({ id, name: id === 1 ? "Diabetes" : id === 2 ? "Hipertensión" : "Condición" })),
          offline: true,
        }
        updatedItems.unshift(mockBeneficiary)
        await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
        
        toast.success("Operación registrada localmente. Se sincronizará al volver a estar en línea.")
        return { ok: true, item: mockBeneficiary } as unknown as T
      } 
      else if (method === "PATCH") {
        const idToUpdate = endpoint.split("/").pop()
        updatedItems = updatedItems.map((item: any) => 
          item.id === idToUpdate ? { ...item, ...body, fullName: `${body?.firstName ?? item.firstName} ${body?.lastName ?? item.lastName}`.trim() } : item
        )
        await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
        
        toast.success("Cambios guardados localmente.")
        return { ok: true } as unknown as T
      } 
      else if (method === "DELETE") {
        const idToDelete = endpoint.split("/").pop()
        updatedItems = updatedItems.filter((item: any) => item.id !== idToDelete)
        await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
        
        toast.success("Eliminación registrada localmente.")
        return { ok: true } as unknown as T
      }
    }
  }

  // 2. Manejo optimista de entrega de raciones
  if (endpoint.startsWith("/api/mobile/deliveries")) {
    const beneficiaryIds = Array.isArray(body?.beneficiaryIds) ? body.beneficiaryIds : []
    
    // Marcar beneficiarios como hasEatenToday
    const cachedList = await getCache<any>("/api/beneficiaries")
    if (cachedList && Array.isArray(cachedList.items)) {
      const updatedItems = cachedList.items.map((b: any) => 
        beneficiaryIds.includes(b.id) ? { ...b, hasEatenToday: true } : b
      )
      await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
    }

    // Actualizar sumario diario en Dashboard
    const cachedDashboard = await getCache<any>("/api/mobile/dashboard")
    if (cachedDashboard) {
      const count = beneficiaryIds.length || Number(body?.totalRations) || 1
      const updatedDashboard = {
        ...cachedDashboard,
        summary: {
          ...cachedDashboard.summary,
          entregadas: (cachedDashboard.summary?.entregadas ?? 0) + count,
          menu: cachedDashboard.summary?.menu ? {
            ...cachedDashboard.summary.menu,
            status: "executed",
            maxServingsRemaining: Math.max(0, (cachedDashboard.summary.menu.maxServingsRemaining ?? 0) - count),
          } : null
        }
      }
      await setCache("/api/mobile/dashboard", updatedDashboard)
    }

    toast.success("Entrega de raciones registrada localmente.")
    // Despachar evento para alertar
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("offline-mutations-updated"))
    }
    return { ok: true, delivery: { id: `temp-del-${Date.now()}`, beneficiaryIds, dishName: body?.dishName } } as unknown as T
  }

  // 3. Manejo optimista de ejecución de planes de menú
  if (endpoint.startsWith("/api/mobile/menu-plans/execute")) {
    const dishName = body?.dishName || "Menú del día"
    const servings = Number(body?.servings) || 100

    const cachedDashboard = await getCache<any>("/api/mobile/dashboard")
    if (cachedDashboard) {
      const updatedDashboard = {
        ...cachedDashboard,
        summary: {
          ...cachedDashboard.summary,
          menu: {
            dishName,
            status: "executed",
            maxServingsRemaining: servings,
          }
        }
      }
      await setCache("/api/mobile/dashboard", updatedDashboard)
    }

    toast.success("Plan de menú ejecutado localmente.")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("offline-mutations-updated"))
    }
    return { ok: true, plan: { id: `temp-plan-${Date.now()}`, dishName, servings } } as unknown as T
  }

  // 4. Manejo optimista de movimientos de inventario
  if (endpoint.startsWith("/api/mobile/inventory/movements")) {
    const supplyItemId = body?.supplyItemId
    const movementType = body?.movementType
    const quantity = Number(body?.quantity) || 0

    const cachedInventory = await getCache<any>("/api/mobile/inventory")
    if (cachedInventory && Array.isArray(cachedInventory.items)) {
      const updatedItems = cachedInventory.items.map((item: any) => {
        if (item.id === supplyItemId) {
          const currentQty = Number(item.cantidad) || 0
          const delta = movementType === "in" ? quantity : -quantity
          const newQty = Math.max(0, currentQty + delta)
          return { ...item, cantidad: newQty }
        }
        return item
      })
      await setCache("/api/mobile/inventory", { ...cachedInventory, items: updatedItems })
    }

    toast.success("Movimiento de inventario registrado localmente.")
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("offline-mutations-updated"))
    }
    return { ok: true, movement: { id: `temp-mov-${Date.now()}`, ...body } } as unknown as T
  }

  // Fallback genérico para mutaciones offline
  toast.success("Operación registrada localmente.")
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline-mutations-updated"))
  }
  return { ok: true, message: "Operación registrada localmente." } as unknown as T
}

/**
 * Hook personalizado que inyecta automáticamente el JWT desde auth-store
 * y maneja errores de red con soporte offline-first completo.
 */
export function useApi() {
  const token = useAuthStore((s) => s.token)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const request = useCallback(
    async <T = unknown>(endpoint: string, opts: ApiOptions = {}): Promise<T> => {
      const { params, ...fetchOpts } = opts
      const url = new URL(`${BASE_URL}${endpoint}`)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

      // Crear la llave de caché única para este endpoint
      const cacheKey = endpoint + (params && Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "")
      const isGet = !fetchOpts.method || fetchOpts.method.toUpperCase() === "GET"
      const isOffline = typeof window !== "undefined" && (!navigator.onLine)

      if (isOffline) {
        if (isGet) {
          const cached = await getCache<T>(cacheKey)
          if (cached) {
            console.log("[useApi] Servido desde caché local (offline):", cacheKey)
            return cached
          }
          throw new Error("Sin conexión. No hay datos locales guardados para esta vista.")
        } else {
          return await handleOfflineMutation<T>(endpoint, fetchOpts)
        }
      }

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

        const data = await res.json()
        
        // Si la petición GET fue exitosa online, guardarla en caché local
        if (isGet) {
          await setCache(cacheKey, data)
        }
        
        return data as T
      } catch (err) {
        // En caso de fallo de red real (ej. servidor caído o timeout)
        if (isGet) {
          const cached = await getCache<T>(cacheKey)
          if (cached) {
            console.log("[useApi] Fallo de red. Sirviendo desde caché local:", cacheKey)
            return cached
          }
        } else if (err instanceof TypeError && err.message === "Failed to fetch") {
          // Si falla fetch en una mutación, registrar localmente
          return await handleOfflineMutation<T>(endpoint, fetchOpts)
        }

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
