import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react" // Import React
import { Toaster } from "@/components/ui/toaster"
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ThemeProvider } from "@/components/themeProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AIDEN - Web3 Agents",
  description: "AIDEN is a Web3 AI Agent platform powered by SEI that connects you to a community of powerful agents and creators.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex justify-center`}>
        <DynamicContextProvider
          settings={{
            environmentId: "08b64418-c698-4620-8ea2-d0e1a31ff10f",
            walletConnectors: [EthereumWalletConnectors],
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </DynamicContextProvider>
      </body>
    </html>
  )
}

