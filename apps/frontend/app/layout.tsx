import "./globals.css"
import type { Metadata } from "next"
import { Alexandria } from "next/font/google"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import DynamicProvider from "@/components/dynamic/provider"
import ScrollToTopButton from "@/components/ui/scroll-to-top-button"
import { cn } from "@/lib/utils"

const alexandria = Alexandria({
  weight: 'variable',
  style: 'normal',
  display: 'swap',
  subsets: ["latin"],
  variable: '--font-alexandria',
});
const pixelCraft = localFont({
  src: './PixelCraft-7BWd4.ttf',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-pixelcraft',
})

export const metadata: Metadata = {
  title: "AIDN - Web3 Agents",
  description: "AIDN is a Web3 AI Agent platform powered by SEI that connects you to a community of powerful agents and creators.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(
        alexandria.variable,
        pixelCraft.variable,
        "scroll-smooth",
      )}
    >
      <body
        className={cn(
          // common
          "w-screen min-h-screen",
          "bg-cover bg-fixed bg-no-repeat",
          // background images
          "bg-[url('/background-light.png')]",
          "dark:bg-[url('/background.png')]",
        )}
      >
        <DynamicProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ScrollToTopButton />
            <Toaster />
          </ThemeProvider>
        </DynamicProvider>
      </body>
    </html>
  )
}

