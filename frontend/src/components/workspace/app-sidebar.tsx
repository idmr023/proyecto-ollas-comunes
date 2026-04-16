'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  ShoppingBasket,
  BarChart3,
  Settings,
  UtensilsCrossed,
  LogOut,
  ChevronsUpDown,
  UserCircle,
} from 'lucide-react';

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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';

/* Nav structure */
const navMain = [
  {
    label: 'Principal',
    items: [
      { title: 'Inicio',        href: '/workspace/home',          icon: Home },
      { title: 'Beneficiarios', href: '/workspace/beneficiarios', icon: Users },
      { title: 'Inventario',    href: '/workspace/inventario',    icon: ShoppingBasket },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { title: 'Reportes',      href: '/workspace/reportes',      icon: BarChart3 },
      { title: 'Configuracion', href: '/workspace/configuracion', icon: Settings },
    ],
  },
];

/* App Sidebar component */
export function AppSidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'OC';

  return (
    <Sidebar collapsible="icon">

      {/* Header - Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <UtensilsCrossed className="size-4 text-sidebar-primary-foreground" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-bold font-heading text-sidebar-foreground">
                  Ollas Comunes
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/60">
                  Panel de gestion
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - Navigation */}
      <SidebarContent className="py-2">
        {navMain.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="default"
                        className="rounded-lg"
                      >
                        <Link href={item.href}>
                          <Icon className="shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer - User dropdown */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="Mi cuenta"
                  className="rounded-lg cursor-pointer"
                >
                  {/* Avatar initials */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold bg-accent text-accent-foreground">
                    {userInitials}
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                      {user?.name ?? 'Usuario'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.email ?? ''}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 rounded-lg"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2 px-1 py-0.5">
                    <div className="flex size-8 items-center justify-center rounded-lg text-xs font-bold bg-accent text-accent-foreground">
                      {userInitials}
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-semibold">
                        {user?.name ?? 'Usuario'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email ?? ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <UserCircle className="size-4" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="size-4" />
                  <span>Preferencias</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => {
                    clearAuth();
                    window.location.href = '/login';
                  }}
                >
                  <LogOut className="size-4" />
                  <span>Cerrar sesion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
