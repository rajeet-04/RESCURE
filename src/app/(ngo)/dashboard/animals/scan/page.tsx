'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const QrScanner = dynamic(() => import('@/components/qr/qr-scanner'), { ssr: false })

// UUID v4 pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(true)
  const [scanned, setScanned] = useState<string | null>(null)

  const handleScan = (code: string) => {
    setScanned(code)
    setScanning(false)

    if (UUID_REGEX.test(code)) {
      router.push(`/dashboard/animals/${code}`)
    } else {
      router.push(`/animals/${code}`)
    }
  }

  const handleClose = () => {
    setScanning(false)
  }

  return (
    <div className="container py-8 max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scan Animal QR Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Point the camera at an animal&apos;s QR code to view their profile.
          </p>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <QrScanner onScan={handleScan} onClose={handleClose} />
          ) : scanned ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Redirecting...</p>
              <p className="text-xs mt-1 font-mono text-muted-foreground">{scanned}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Scanning stopped.</p>
              <button
                onClick={() => setScanning(true)}
                className="text-sm text-blue-600 underline mt-2"
              >
                Scan again
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>✅ Scan a UUID QR code → redirects to NGO animal profile</p>
        <p>🌐 Scan a public slug QR code → redirects to public profile</p>
      </div>
    </div>
  )
}
