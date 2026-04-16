import type { Metadata } from "next";
import { inter, plusJakartaSans, jetbrainsMono } from "./fonts";
import "./globals.css";
import { ThemeProvider } from "@/components/general/theme-provider";
import AuthInitializer from "@/components/auth/auth-initializer";
import { Toaster } from "@/components/ui/sonner";

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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthInitializer>
            {children}
            <Toaster
              position="top-right"
              richColors
            />
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
