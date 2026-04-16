"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { useThemeStore } from "@/store/theme-store"

function ThemeSync() {
  const { setTheme } = useTheme()
  const theme = useThemeStore((state) => state.theme)

  React.useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}
