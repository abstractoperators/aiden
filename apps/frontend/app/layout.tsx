import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react" // Import React
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AIDEN - Web3 Agents",
  description: "StreamLine is a modern SaaS platform that helps you streamline your business processes.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex justify-center`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

