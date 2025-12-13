import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { BaseProvider } from "@/contexts/base-context"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "comment bot tool",
  description: "Created by AIVS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <BaseProvider>
            <Suspense>
              <Navbar />
              {children}
              <Toaster />
              <Analytics />
            </Suspense>
          </BaseProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
