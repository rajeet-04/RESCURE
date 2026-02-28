import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { PostHogProvider } from '@/lib/posthog-provider'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: {
    default: 'PawCivic — Stray Animal Rescue',
    template: '%s | PawCivic',
  },
  description: 'Report, rescue, and sponsor stray animals in your city. Connecting citizens, NGOs, vets and sponsors.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PawCivic',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'PawCivic',
    title: 'PawCivic — Stray Animal Rescue',
    description: 'Report injured strays, connect with NGOs, sponsor animal care.',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
