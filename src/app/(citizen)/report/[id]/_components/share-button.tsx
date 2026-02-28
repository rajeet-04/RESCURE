'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  url: string
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  async function handleShare() {
    const fullUrl = `${window.location.origin}${url}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `RESCURE — ${title}`, url: fullUrl })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(fullUrl)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="border-orange-300 text-orange-600 hover:bg-orange-50"
    >
      <Share2 className="mr-1.5 h-4 w-4" />
      Share
    </Button>
  )
}
