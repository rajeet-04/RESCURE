'use client'

import { useRouter } from 'next/navigation'

interface ImpactReportClientProps {
  currentMonth: string
}

export default function ImpactReportClient({ currentMonth }: ImpactReportClientProps) {
  const router = useRouter()

  function handlePrint() {
    window.print()
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/sponsor/impact?month=${e.target.value}`)
  }

  function handleShare() {
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'My RESCURE Impact Report', url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => null)
    }
  }

  // Build last 12 months options
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center no-print">
      <select
        value={currentMonth}
        onChange={handleMonthChange}
        className="border rounded-md px-3 py-2 text-sm bg-white"
        aria-label="Select month"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={handlePrint}
        className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
      >
        🖨️ Print / Save PDF
      </button>
      <button
        onClick={handleShare}
        className="border border-orange-600 text-orange-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
      >
        🔗 Share
      </button>
    </div>
  )
}
