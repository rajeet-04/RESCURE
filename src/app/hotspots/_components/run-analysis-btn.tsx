'use client'

import { useState } from 'react'
import { Zap, CheckCircle, XCircle } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function RunAnalysisBtn({ userRole }: { userRole: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  if (userRole !== 'PLATFORM_ADMIN') return null

  async function handleClick() {
    setStatus('loading')
    try {
      const res = await fetch('/api/admin/risk/calculate', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { zonesAnalyzed: number; surgesTriggered: number; riskFactorsCreated: number }
      setMessage(`${data.riskFactorsCreated} signals ingested · ${data.zonesAnalyzed} zones scored · ${data.surgesTriggered} surges triggered`)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setMessage('Failed to run predictive analysis')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {status === 'loading' ? 'Analyzing…' : 'Run Analysis'}
      </button>
      {status === 'success' && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          {message}
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <XCircle className="w-3.5 h-3.5" />
          {message}
        </span>
      )}
    </div>
  )
}
