"use client"

import { useCallback } from "react"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"
import { getCache, setCache, addMutation } from "@/lib/indexed-db"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

interface ApiOptions extends RequestInit {
  params?: Record<string, string>
}

function generateTempId(): string {
  return `temp-${Math.floor(100000 + Math.random() * 900000)}`
}

function buildUrl(endpoint: string, params?: Record<string, string>): URL {
  const url = new URL(`${BASE_URL}${endpoint}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  return url
}

function buildCacheKey(endpoint: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return endpoint
  return `${endpoint}?${new URLSearchParams(params).toString()}`
}

function isGetRequest(method: string | undefined): boolean {
  return !method || method.toUpperCase() === "GET"
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}

function buildRequestHeaders(fetchOpts: RequestInit, token: string | null): Record<string, string> {
  const customHeaders =
    fetchOpts.headers && typeof fetchOpts.headers === "object" && !Array.isArray(fetchOpts.headers)
      ? (fetchOpts.headers as Record<string, string>)
      : {}
  return {
    "Content-Type": "application/json",
    ...customHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function notifyOfflineMutationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline-mutations-updated"))
  }
}

function buildMockBeneficiary(body: any, tempId: string) {
  return {
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
    healthConditions: (body?.healthConditionIds ?? []).map((id: number) => ({
      id,
      name: id === 1 ? "Diabetes" : id === 2 ? "Hipertensión" : "Condición",
    })),
    offline: true,
  }
}

async function applyBeneficiariesOptimistic(
  method: string,
  endpoint: string,
  body: any,
  tempId: string | undefined,
): Promise<unknown | null> {
  if (!endpoint.startsWith("/api/beneficiaries")) return null
  const cachedList = await getCache<any>("/api/beneficiaries")
  if (!cachedList || !Array.isArray(cachedList.items)) return null

  if (method === "POST" && tempId) {
    const mockBeneficiary = buildMockBeneficiary(body, tempId)
    const updatedItems = [mockBeneficiary, ...cachedList.items]
    await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
    toast.success("Operación registrada localmente. Se sincronizará al volver a estar en línea.")
    return { ok: true, item: mockBeneficiary }
  }

  if (method === "PATCH") {
    const idToUpdate = endpoint.split("/").pop()
    const updatedItems = cachedList.items.map((item: any) =>
      item.id === idToUpdate
        ? {
            ...item,
            ...body,
            fullName: `${body?.firstName ?? item.firstName} ${body?.lastName ?? item.lastName}`.trim(),
          }
        : item,
    )
    await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
    toast.success("Cambios guardados localmente.")
    return { ok: true }
  }

  if (method === "DELETE") {
    const idToDelete = endpoint.split("/").pop()
    const updatedItems = cachedList.items.filter((item: any) => item.id !== idToDelete)
    await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
    toast.success("Eliminación registrada localmente.")
    return { ok: true }
  }

  return null
}

async function applyDeliveriesOptimistic(body: any) {
  const beneficiaryIds = Array.isArray(body?.beneficiaryIds) ? body.beneficiaryIds : []

  const cachedList = await getCache<any>("/api/beneficiaries")
  if (cachedList && Array.isArray(cachedList.items)) {
    const updatedItems = cachedList.items.map((b: any) =>
      beneficiaryIds.includes(b.id) ? { ...b, hasEatenToday: true } : b,
    )
    await setCache("/api/beneficiaries", { ...cachedList, items: updatedItems })
  }

  const cachedDashboard = await getCache<any>("/api/mobile/dashboard")
  if (cachedDashboard) {
    const count = beneficiaryIds.length || Number(body?.totalRations) || 1
    const updatedDashboard = {
      ...cachedDashboard,
      summary: {
        ...cachedDashboard.summary,
        entregadas: (cachedDashboard.summary?.entregadas ?? 0) + count,
        menu: cachedDashboard.summary?.menu
          ? {
              ...cachedDashboard.summary.menu,
              status: "executed",
              maxServingsRemaining: Math.max(
                0,
                (cachedDashboard.summary.menu.maxServingsRemaining ?? 0) - count,
              ),
            }
          : null,
      },
    }
    await setCache("/api/mobile/dashboard", updatedDashboard)
  }

  toast.success("Entrega de raciones registrada localmente.")
  notifyOfflineMutationsUpdated()
  return {
    ok: true,
    delivery: {
      id: `temp-del-${Date.now()}`,
      beneficiaryIds,
      dishName: body?.dishName,
    },
  }
}

async function applyMenuPlansOptimistic(body: any) {
  const dishName = body?.dishName || "Menú del día"
  const servings = Number(body?.servings) || 100

  const cachedDashboard = await getCache<any>("/api/mobile/dashboard")
  if (cachedDashboard) {
    const updatedDashboard = {
      ...cachedDashboard,
      summary: {
        ...cachedDashboard.summary,
        menu: { dishName, status: "executed", maxServingsRemaining: servings },
      },
    }
    await setCache("/api/mobile/dashboard", updatedDashboard)
  }

  toast.success("Plan de menú ejecutado localmente.")
  notifyOfflineMutationsUpdated()
  return { ok: true, plan: { id: `temp-plan-${Date.now()}`, dishName, servings } }
}

async function applyInventoryOptimistic(body: any) {
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
  notifyOfflineMutationsUpdated()
  return { ok: true, movement: { id: `temp-mov-${Date.now()}`, ...body } }
}

async function handleOfflineMutation<T = unknown>(endpoint: string, opts: RequestInit): Promise<T> {
  const method = (opts.method ?? "POST").toUpperCase() as "POST" | "PATCH" | "DELETE"
  const body = opts.body ? JSON.parse(opts.body as string) : null
  const tempId = method === "POST" ? generateTempId() : undefined

  console.log("[useApi Offline] Encolando cambio offline en useApi:", method, endpoint, body, "tempId:", tempId)
  await addMutation(endpoint, method, body, tempId)

  if (endpoint.startsWith("/api/beneficiaries")) {
    const result = await applyBeneficiariesOptimistic(method, endpoint, body, tempId)
    if (result) return result as T
  }

  if (endpoint.startsWith("/api/mobile/deliveries")) {
    return (await applyDeliveriesOptimistic(body)) as T
  }

  if (endpoint.startsWith("/api/mobile/menu-plans/execute")) {
    return (await applyMenuPlansOptimistic(body)) as T
  }

  if (endpoint.startsWith("/api/mobile/inventory/movements")) {
    return (await applyInventoryOptimistic(body)) as T
  }

  toast.success("Operación registrada localmente.")
  notifyOfflineMutationsUpdated()
  return { ok: true, message: "Operación registrada localmente." } as unknown as T
}

async function handleAuthError(res: Response, clearAuth: () => void): Promise<never> {
  if (res.status === 401 && navigator.onLine) {
    clearAuth()
    document.cookie = "sigo_session=; path=/; max-age=0"
    if (typeof window !== "undefined") window.location.href = "/login"
    throw new Error("Sesión expirada. Ingresa nuevamente.")
  }
  throw new Error("Sin conexión. No se pudo validar la sesión.")
}

async function tryCacheFallback<T>(cacheKey: string): Promise<T | null> {
  const cached = await getCache<T>(cacheKey)
  if (cached) {
    console.log("[useApi] Fallo de red. Sirviendo desde caché local:", cacheKey)
    return cached
  }
  return null
}

async function serveOfflineOrEnqueue<T>(
  cacheKey: string,
  endpoint: string,
  fetchOpts: RequestInit,
  isGet: boolean,
): Promise<T> {
  if (isGet) {
    const cached = await getCache<T>(cacheKey)
    if (cached) {
      console.log("[useApi] Servido desde caché local (offline):", cacheKey)
      return cached
    }
    throw new Error("Sin conexión. No hay datos locales guardados para esta vista.")
  }
  return await handleOfflineMutation<T>(endpoint, fetchOpts)
}

async function parseErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  return body.message ?? body.error ?? `Error ${res.status}`
}

async function fetchAndHandle<T>(
  url: string,
  fetchOpts: RequestInit,
  headers: Record<string, string>,
  cacheKey: string,
  isGet: boolean,
  clearAuth: () => void,
  endpoint: string,
): Promise<T> {
  const res = await fetch(url, { ...fetchOpts, headers })
  if (res.status === 401) {
    return await handleAuthError(res, clearAuth)
  }
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res))
  }
  const data = await res.json()
  if (isGet) await setCache(cacheKey, data)
  return data as T
}

export function useApi() {
  const token = useAuthStore((s) => s.token)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const request = useCallback(
    async <T = unknown>(endpoint: string, opts: ApiOptions = {}): Promise<T> => {
      const { params, ...fetchOpts } = opts
      const url = buildUrl(endpoint, params)
      const cacheKey = buildCacheKey(endpoint, params)
      const isGet = isGetRequest(fetchOpts.method)
      const online = isOnline()

      if (!online) {
        return serveOfflineOrEnqueue<T>(cacheKey, endpoint, fetchOpts, isGet)
      }

      const headers = buildRequestHeaders(fetchOpts, token)
      try {
        return await fetchAndHandle<T>(
          url.toString(),
          fetchOpts,
          headers,
          cacheKey,
          isGet,
          clearAuth,
          endpoint,
        )
      } catch (err) {
        if (isGet) {
          const cached = await tryCacheFallback<T>(cacheKey)
          if (cached) return cached
        } else if (err instanceof TypeError && err.message === "Failed to fetch") {
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
