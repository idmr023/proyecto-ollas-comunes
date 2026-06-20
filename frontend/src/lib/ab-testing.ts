"use client"

import { useState, useEffect, useCallback } from "react"

interface AbTestConfig {
  testId: string
  variant: "A" | "B"
}

function generateVariant(): "A" | "B" {
  return Math.random() < 0.5 ? "A" : "B"
}

function isLocalStorageAvailable(): boolean {
  try {
    const test = "__ab_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

function getFromStorage(testId: string): string | null {
  if (!isLocalStorageAvailable()) return null
  try {
    return localStorage.getItem(`ab_${testId}`)
  } catch {
    return null
  }
}

function saveToStorage(testId: string, variant: string): void {
  if (!isLocalStorageAvailable()) return
  try {
    localStorage.setItem(`ab_${testId}`, variant)
  } catch {
    // silencio
  }
}

function trackImpression(testId: string, variant: string): void {
  if (typeof window === "undefined") return
  try {
    const payload = {
      testId,
      variant,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    }
    const storageKey = `ab_impressions_${testId}`
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]")
    existing.push(payload)
    localStorage.setItem(storageKey, JSON.stringify(existing))
  } catch {
    // silencio
  }
}

export function trackConversion(testId: string, variant: string, action: string): void {
  if (typeof window === "undefined") return
  try {
    const payload = {
      testId,
      variant,
      action,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    }
    const storageKey = `ab_conversions_${testId}`
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]")
    existing.push(payload)
    localStorage.setItem(storageKey, JSON.stringify(existing))
  } catch {
    // silencio
  }
}

export function getTestResults(testId: string): {
  impressions: { A: number; B: number }
  conversions: Record<string, { A: number; B: number }>
} {
  if (typeof window === "undefined") return { impressions: { A: 0, B: 0 }, conversions: {} }

  const impressionsRaw = JSON.parse(localStorage.getItem(`ab_impressions_${testId}`) || "[]")
  const conversionsRaw = JSON.parse(localStorage.getItem(`ab_conversions_${testId}`) || "[]")

  const impressions = { A: 0, B: 0 }
  for (const imp of impressionsRaw) {
    if (imp.variant === "A") impressions.A++
    if (imp.variant === "B") impressions.B++
  }

  const conversions: Record<string, { A: number; B: number }> = {}
  for (const conv of conversionsRaw) {
    if (!conversions[conv.action]) conversions[conv.action] = { A: 0, B: 0 }
    if (conv.variant === "A") conversions[conv.action].A++
    if (conv.variant === "B") conversions[conv.action].B++
  }

  return { impressions, conversions }
}

export function useAbTest(
  testId: string,
): { variant: "A" | "B"; testId: string; trackConversion: (action: string) => void } {
  const [variant, setVariant] = useState<"A" | "B">("A")

  useEffect(() => {
    const stored = getFromStorage(testId)
    if (stored === "A" || stored === "B") {
      setVariant(stored)
      return
    }

    const assigned = generateVariant()
    saveToStorage(testId, assigned)
    setVariant(assigned)
    trackImpression(testId, assigned)
  }, [testId])

  useEffect(() => {
    trackImpression(testId, variant)
  }, [testId, variant])

  const handleConversion = useCallback(
    (action: string) => {
      trackConversion(testId, variant, action)
    },
    [testId, variant],
  )

  return { variant, testId, trackConversion: handleConversion }
}

export function AbDebugPanel({ testIds }: { testIds: string[] }) {
  const [, forceUpdate] = useState(0)

  if (typeof window === "undefined") return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-foreground">A/B Debug</span>
        <button
          onClick={() => forceUpdate((n) => n + 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ↻
        </button>
      </div>
      {testIds.map((id) => {
        const variant = getFromStorage(id) || "—"
        const results = getTestResults(id)
        return (
          <div key={id} className="mb-1">
            <span className="text-muted-foreground">{id}:</span>{" "}
            <span className="font-bold text-foreground">{variant}</span>
            {" · "}
            <span className="text-muted-foreground">
              A:{results.impressions.A} B:{results.impressions.B}
            </span>
          </div>
        )
      })}
    </div>
  )
}
