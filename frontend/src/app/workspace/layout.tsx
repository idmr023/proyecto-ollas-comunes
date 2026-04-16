import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/workspace/app-sidebar';

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
          {/* Sidebar toggle */}
          <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />

          {/* Divider */}
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-sans text-muted-foreground">
            Ollas Comunes
          </span>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
