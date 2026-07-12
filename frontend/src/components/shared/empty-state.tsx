import { LucideIcon, AlertTriangle } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon = AlertTriangle, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-3 text-xs font-medium text-[#0F3821] underline">
          {action.label}
        </button>
      )}
    </div>
  )
}
