/**
 * fonts.ts — Ollas Comunes
 *
 * Archivo centralizado de fuentes. Exporta cada fuente como módulo
 * para que puedan usarse de forma selectiva en componentes específicos.
 *
 * Fuentes:
 *   - Plus Jakarta Sans → Headings (--font-heading)
 *   - Inter             → Body / UI (--font-sans)
 *   - JetBrains Mono    → Código / IDs (--font-mono)
 */

import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
