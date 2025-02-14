"use client"

import Image, { ImageProps } from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeImageProps extends Omit<ImageProps, "src"> {
  lightSrc: string;
  darkSrc: string;
}

// look at the link below if we need to rewrite this to use the placeholder prop
// https://nextjs.org/docs/app/api-reference/components/image#theme-detection-css
export default function ThemeImage({
  lightSrc,
  darkSrc,
  ...props
}: ThemeImageProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // Avoid hydration mismatches by waiting until mounted on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Render children without ThemeProvider during SSR
  if (!mounted) {
    return "AIDEN"
  }

  const src = currentTheme === "light" ? lightSrc : darkSrc;

  return <Image src={src} {...props} />
}