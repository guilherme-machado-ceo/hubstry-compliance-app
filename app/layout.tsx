import type { Metadata, Viewport } from "next"
import { Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Hubstry Compliance — Scanner da ECA Digital (Lei 15.211/2025)",
  description:
    "Audite sites e aplicações contra os 8 pilares da ECA Digital. Diagnóstico de conformidade digital instantâneo, sem cadastro e sem retenção de dados. Por Hubstry Deep Tech.",
  keywords: [
    "ECA Digital",
    "Lei 15.211/2025",
    "compliance digital",
    "LGPD",
    "proteção de menores",
    "dark patterns",
    "Hubstry",
  ],
  authors: [{ name: "Hubstry Deep Tech" }],
  openGraph: {
    title: "Hubstry Compliance — Scanner da ECA Digital",
    description:
      "Diagnóstico de conformidade digital contra os 8 pilares da ECA Digital (Lei 15.211/2025).",
    type: "website",
    locale: "pt_BR",
  },
}

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable} ${mono.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
