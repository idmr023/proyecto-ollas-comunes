"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Users, AlertTriangle, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const tabs = [
  { href: "/mobile/inicio", label: "Inicio", icon: Home },
  { href: "/mobile/inventario", label: "Inventario", icon: Package },
  { href: "/mobile/padron", label: "Padrón", icon: Users },
  { href: "/mobile/alertas", label: "Alertas", icon: AlertTriangle },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                "min-h-[48px] min-w-[64px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "text-primary")} />
              <span className={cn("text-[11px] leading-tight", active && "font-semibold")}>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => {
            clearAuth()
            document.cookie = "sigo_session=; path=/; max-age=0"
          }}
          className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-[48px] min-w-[64px] text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-[11px] leading-tight">Salir</span>
        </button>
      </div>
    </nav>
  )
}
