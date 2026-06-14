import type { Metadata } from "next";
import { inter, plusJakartaSans, jetbrainsMono } from "./fonts";
import "./globals.css";
import { ThemeProvider } from "@/components/general/theme-provider";
import AuthInitializer from "@/components/auth/auth-initializer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineBanner from '@/components/ui/offline-banner'
import PwaSyncManager from '@/components/general/pwa-sync-manager'

export const metadata: Metadata = {
  title: "Ollas Comunes",
  description: "Plataforma SaaS para la gestión de ollas comunes en el Perú. Administra beneficiarios, raciones, inventario y reportes en un solo lugar.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ollas Comunes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('[PWA] Service Worker registrado con éxito:', reg.scope);
                  }).catch(function(err) {
                    console.warn('[PWA] Error al registrar el Service Worker:', err);
                  });
                });
              }
            `
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <AuthInitializer>
              <div>
                <OfflineBanner />
                <PwaSyncManager />
                {children}
              </div>
              <Toaster
                position="top-right"
                richColors
              />
            </AuthInitializer>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Offline banner is implemented as a client component in
// `src/components/ui/offline-banner.tsx`
