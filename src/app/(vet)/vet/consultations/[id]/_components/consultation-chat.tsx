'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date | string
  attachments: string[]
}

interface ConsultationChatProps {
  consultationId: string
  initialMessages: Message[]
  currentUserId: string
}

export default function ConsultationChat({
  consultationId,
  initialMessages,
  currentUserId,
}: ConsultationChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })
      if (res.ok) {
        const { message } = await res.json()
        setMessages((prev) => [...prev, message])
        setNewMessage('')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages yet. Start the consultation.
            </p>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 text-sm ${
                      isSelf
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isSelf ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your response..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
