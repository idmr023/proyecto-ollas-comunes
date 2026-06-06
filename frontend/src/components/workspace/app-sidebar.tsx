"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Building2,
  CookingPot,
  Users,
  Package,
  BarChart3,
  UserCog,
  Bell,
  Settings,
  LogOut,
  ChevronsUpDown,
  UserCircle,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/auth-store"

const defaultDemoUser = {
  fullName: "OC Usuario",
  email: "usuario@ollascomunes.pe",
}

const navMain = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", href: "/workspace/home", icon: Home },
      { title: "Organizaciones", href: "/workspace/organizaciones", icon: Building2 },
      { title: "Ollas comunes", href: "/workspace/organizaciones", icon: CookingPot },
      { title: "Beneficiarios", href: "/workspace/beneficiarios", icon: Users },
      { title: "Inventario", href: "/workspace/inventario", icon: Package },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Reportes", href: "/workspace/reportes", icon: BarChart3 },
      { title: "Usuarios", href: "/workspace/configuracion", icon: UserCog },
      { title: "Notificaciones", href: "/workspace/configuracion", icon: Bell },
      { title: "Configuración", href: "/workspace/configuracion", icon: Settings },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()
  const { setOpenMobile } = useSidebar()
  const currentUser = user ?? defaultDemoUser

  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OC"

  return (
    <Sidebar collapsible="icon">
      {/* Header — Logo circular amarillo/naranja */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none h-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-[#F4A950] text-sm font-bold text-white shadow-sm">
                OC
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-bold text-sidebar-foreground">
                  Ollas Comunes
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">
                  Panel de gestión
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — Navegación */}
      <SidebarContent className="py-2">
        {navMain.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, _idx, arr) => {
                  const matchesExact = pathname === item.href
                  const matchesChild = pathname.startsWith(item.href + "/")
                  const isDup = arr.some(
                    (s) => s.href === item.href && arr.indexOf(s) !== arr.lastIndexOf(s),
                  )
                  let isActive = false
                  if (!isDup) {
                    isActive = matchesExact || matchesChild
                  } else {
                    const last = arr.findLast((s) => s.href === item.href)
                    isActive = (matchesExact || matchesChild) && last === item
                  }
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="default"
                        className="rounded-lg data-[active=true]:border-l-4 data-[active=true]:border-l-[#F4A950] data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold"
                      >
                        <Link href={item.href} onClick={() => setOpenMobile(false)}>
                          <Icon className="shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer — Perfil de usuario */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Mi cuenta"
                  className="cursor-pointer rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
                    {userInitials}
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                      {currentUser.fullName}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {currentUser.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 rounded-lg"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2 px-1 py-0.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
                      {userInitials}
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {currentUser.fullName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/workspace/perfil" onClick={() => setOpenMobile(false)}>
                    <UserCircle className="size-4" />
                    <span>Mi perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/workspace/preferencias" onClick={() => setOpenMobile(false)}>
                    <Settings className="size-4" />
                    <span>Preferencias</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => {
                    clearAuth()
                    window.location.href = "/login"
                  }}
                >
                  <LogOut className="size-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
