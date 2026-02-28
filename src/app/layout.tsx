import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import './globals.css'
import { PostHogProvider } from '@/lib/posthog-provider'

const OfflineBanner = dynamic(() => import('@/components/pwa/offline-banner'), { ssr: false })
const InstallPrompt = dynamic(() => import('@/components/pwa/install-prompt'), { ssr: false })

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
          <OfflineBanner />
          {children}
          <InstallPrompt />
        </PostHogProvider>
      </body>
    </html>
  )
}
