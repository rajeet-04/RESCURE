'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Camera, X } from 'lucide-react'

interface ImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void
}

interface UploadedImage {
  url: string
  publicId: string
}

const MAX_IMAGES = 5

export default function ImageUploader({ onImagesUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    const remaining = MAX_IMAGES - images.length
    const selected = Array.from(files).slice(0, remaining)

    if (selected.length === 0) return
    setUploading(true)
    setError(null)
    setProgress(0)

    const uploaded: UploadedImage[] = []

    for (let i = 0; i < selected.length; i++) {
      const formData = new FormData()
      formData.append('file', selected[i])

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload failed')
        const data: UploadedImage = await res.json()
        uploaded.push(data)
      } catch {
        setError(`Failed to upload ${selected[i].name}`)
      }

      setProgress(Math.round(((i + 1) / selected.length) * 100))
    }

    const updated = [...images, ...uploaded]
    setImages(updated)
    onImagesUploaded(updated.map((img) => img.url))
    setUploading(false)
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index)
    setImages(updated)
    onImagesUploaded(updated.map((img) => img.url))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={img.publicId} className="relative h-20 w-20 overflow-hidden rounded-md border border-orange-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 border-dashed border-orange-300 text-orange-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50"
              title="Take a photo"
            >
              <Camera className="h-6 w-6" />
              <span className="mt-1 text-xs">Camera</span>
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center rounded-md border-2 border-dashed border-orange-300 text-orange-400 hover:border-orange-500 hover:text-orange-600 disabled:opacity-50"
              title="Upload from gallery"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="mt-1 text-xs">Gallery</span>
            </button>
          </>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {uploading && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-orange-600">Uploading… {progress}%</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-400">
        {images.length}/{MAX_IMAGES} photos added
      </p>
    </div>
  )
}
