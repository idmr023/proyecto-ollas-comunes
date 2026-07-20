"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RefreshButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
  className?: string
}

export function RefreshButton({ onClick, loading, label = "Actualizar", className }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={cn("rounded-xl gap-2 self-start sm:self-auto transition-transform active:scale-95", className)}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {label}
    </Button>
  )
}
