import AuthGuard from '@/components/auth/auth-guard'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/workspace/app-sidebar';

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
          {/* Sidebar toggle */}
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

          {/* Divider */}
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-sans font-medium text-foreground">
              Ollas Comunes
            </span>
            <span className="hidden sm:block text-xs text-muted-foreground">
              Plataforma de gestion comunitaria
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col gap-5 bg-background p-5 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </AuthGuard>
  );
}
