"use client"

import { cn } from "@/lib/utils"

interface SelectFieldProps {
  label?: string
  id?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  selectClassName?: string
}

export function SelectField({ label, id, value, onChange, options, placeholder, className, selectClassName }: SelectFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-10 rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", selectClassName)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
