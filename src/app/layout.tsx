import type { Metadata } from "next"
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google"

import { AppProviders } from "@/components/app-providers"

import "./globals.css"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
  ),
  title: {
    default: "Ahead · 功能预告订阅",
    template: "%s · Ahead",
  },
  description: "创建、发布并管理功能预告订阅页，把每次产品上线变成一次有序抵达。",
  applicationName: "Ahead",
  keywords: ["功能预告", "订阅页面", "产品发布", "预约"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Ahead",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
