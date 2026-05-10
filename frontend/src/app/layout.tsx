import type { Metadata } from "next";
import { inter, plusJakartaSans, jetbrainsMono } from "./fonts";
import "./globals.css";
import { ThemeProvider } from "@/components/general/theme-provider";
import AuthInitializer from "@/components/auth/auth-initializer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import useOnline from '@/hooks/use-online'

export const metadata: Metadata = {
  title: "Ollas Comunes",
  description: "Plataforma SaaS para la gestión de ollas comunes en el Perú. Administra beneficiarios, raciones, inventario y reportes en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
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

function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ffcc00', color: '#000', padding: '6px 12px', zIndex: 9999, textAlign: 'center' }}>
      Sin conexión — modo offline activado
    </div>
  )
}
