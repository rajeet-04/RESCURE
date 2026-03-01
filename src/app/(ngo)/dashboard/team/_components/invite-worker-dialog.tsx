'use client'

import { useState } from 'react'
import { Copy, Check, UserPlus, Link2, Share2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface InviteWorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ngoId: string
  ngoName: string
}

export default function InviteWorkerDialog({
  open,
  onOpenChange,
  ngoId,
  ngoName,
}: InviteWorkerDialogProps) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(
    typeof navigator !== 'undefined' && !!navigator.share
  )

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/worker/onboarding?ngoId=${ngoId}`
      : `/worker/onboarding?ngoId=${ngoId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink)
    } catch {
      // Fallback for non-HTTPS / older browsers
      const el = document.createElement('textarea')
      el.value = inviteLink
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: `Join ${ngoName} on RESCURE`,
        text: `You're invited to join ${ngoName} as a field worker on RESCURE.`,
        url: inviteLink,
      })
    } catch {
      // user cancelled or not supported
      setCanShare(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-left">Invite Field Worker</DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-left">
            Share this link with anyone you want to join{' '}
            <strong>{ngoName}</strong> as a field worker. They&apos;ll need to
            sign in and complete a short onboarding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Invite Link
                </>
              )}
            </Button>
            {canShare && (
              <Button onClick={handleShare} variant="outline" className="w-full gap-2">
                <Share2 className="h-4 w-4" />
                Share via Apps
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-gray-400">
            The link can be used multiple times — anyone who follows it can
            join your team.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
