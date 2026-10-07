import type { Metadata } from "next"
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google"

import { AppProviders } from "@/components/app-providers"
import { productConfig } from "@/lib/product-config"

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
    default: `${productConfig.name} · 功能预告订阅`,
    template: `%s · ${productConfig.name}`,
  },
  description: `${productConfig.fullName}。${productConfig.tagline}。`,
  applicationName: productConfig.name,
  keywords: ["功能预告", "订阅页面", "产品发布", "预约", "REPS"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: productConfig.name,
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
