import "./globals.css"
import type { Metadata } from "next"
import { Aldrich, Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import DynamicProvider from "@/components/dynamic/provider"
import ScrollToTopButton from "@/components/ui/scroll-to-top-button"

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})
const aldrich = Aldrich({
  weight: "400",
  subsets: ["latin"],
  variable: '--font-aldrich',
  display: 'swap',
});

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
      className={[
        aldrich.variable,
        inter.variable,
        "scroll-smooth",
      ].join(" ")}
    >
      <body
        className={[
          // common
          "w-screen min-h-screen",
          "bg-cover bg-fixed bg-no-repeat",
          // backup light background
          "bg-right-top bg-anakiwa-lighter",
          // backup dark background
          "dark:bg-right dark:bg-anakiwa-darkest",
          // background images
          "bg-[url(/brand_assets/background-sky.png)]",
          "dark:bg-[url(/brand_assets/background-orbit.png)]",
        ].join(" ")}
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

