"use client"

import { ComponentProps, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatches by waiting until mounted on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Render children without ThemeProvider during SSR
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}