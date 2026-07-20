"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchInput({ placeholder = "Buscar...", value, onChange, className }: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-transparent pl-9 pr-4 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  )
}
