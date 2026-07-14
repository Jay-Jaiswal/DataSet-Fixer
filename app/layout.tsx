import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FileStoreProvider } from "@/components/file-store-provider"

export const metadata: Metadata = {
  title: "DataFixer Studio",
  description: "Upload, clean, and train your data effortlessly",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider defaultTheme="system" storageKey="datafixer-ui-theme">
          <FileStoreProvider>
            {children}
          </FileStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
