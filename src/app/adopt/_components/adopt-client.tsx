'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type AnimalItem = {
  id: string
  name: string | null
  species: string
  status: string
  photos: string[]
  intakeDate: string
  _count: { sponsorships: number }
  expenses: { amount: number }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  IN_TREATMENT: { label: 'In Treatment', color: 'bg-orange-100 text-orange-800' },
  STABLE: { label: 'Stable', color: 'bg-blue-100 text-blue-800' },
  READY_FOR_ADOPTION: { label: 'Ready for Adoption', color: 'bg-green-100 text-green-800' },
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'care', label: 'Needs Care' },
  { key: 'adopt', label: 'Ready to Adopt' },
]

export default function AdoptClient({ animals }: { animals: AnimalItem[] }) {
  const [tab, setTab] = useState('all')

  const filtered = animals.filter((a) => {
    if (tab === 'care') return a.status === 'IN_TREATMENT' || a.status === 'STABLE'
    if (tab === 'adopt') return a.status === 'READY_FOR_ADOPTION'
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Adopt &amp; Sponsor</h1>
        <p className="mt-1 text-gray-500">Help rescued animals by sponsoring their care.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.key
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No animals found in this category.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((animal) => {
          const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0)
          const cfg = STATUS_CONFIG[animal.status] ?? { label: animal.status, color: 'bg-gray-100 text-gray-600' }

          return (
            <Card key={animal.id} className="overflow-hidden">
              <div className="h-48 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                {animal.photos[0] ? (
                  <Image
                    src={animal.photos[0]}
                    alt={animal.name ?? animal.species}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-5xl">🐾</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {animal.name ?? `Unnamed ${animal.species}`}
                  </h2>
                  <Badge className={cfg.color}>{cfg.label}</Badge>
                </div>
                <p className="text-sm text-gray-500 capitalize">{animal.species}</p>
              </CardHeader>
              <CardContent className="pb-2 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total expenses</span>
                  <span className="font-medium">₹{totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active sponsors</span>
                  <span className="font-medium">{animal._count.sponsorships}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <Link href={`/adopt/${animal.id}`}>Sponsor</Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
