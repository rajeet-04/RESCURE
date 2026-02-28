import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PostHogProvider } from '@/lib/posthog-provider'
import OfflineBanner from '@/components/pwa/offline-banner'
import InstallPrompt from '@/components/pwa/install-prompt'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RESCURE — Stray Animal Rescue',
    template: '%s | RESCURE',
  },
  description: 'Report, rescue, and sponsor stray animals in your city. Connecting citizens, NGOs, vets and sponsors.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RESCURE',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'RESCURE',
    title: 'RESCURE — Stray Animal Rescue',
    description: 'Report injured strays, connect with NGOs, sponsor animal care.',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>
          <OfflineBanner />
          {children}
          <InstallPrompt />
        </PostHogProvider>
      </body>
    </html>
  )
}
