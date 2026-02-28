'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('scanning')
          scan()
        }
      } catch {
        setStatus('error')
        setErrorMsg('Camera access denied or unavailable.')
      }
    }

    const scan = async () => {
      if (!active || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const jsQR = (await import('jsqr')).default
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          onScan(code.data)
          return
        }
      }

      animFrameRef.current = requestAnimationFrame(scan)
    }

    startCamera()

    return () => {
      active = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onScan])

  const handleStop = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onClose()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {status === 'error' ? (
        <div className="text-red-500 text-sm">{errorMsg}</div>
      ) : (
        <>
          <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-sm text-muted-foreground">
            {status === 'starting' ? 'Starting camera...' : 'Scanning...'}
          </p>
        </>
      )}
      <Button variant="outline" onClick={handleStop}>Stop Scanning</Button>
    </div>
  )
}
