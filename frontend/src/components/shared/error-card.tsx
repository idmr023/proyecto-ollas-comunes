"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorCardProps {
  message: string
  onRetry: () => void
  className?: string
}

export function ErrorCard({ message, onRetry, className }: ErrorCardProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-4", className)}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="rounded-lg text-xs">
        Reintentar
      </Button>
    </div>
  )
}
