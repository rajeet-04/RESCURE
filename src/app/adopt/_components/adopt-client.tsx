'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Heart } from 'lucide-react'

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
  IN_TREATMENT: { label: 'In Treatment', color: 'bg-warning text-white' },
  STABLE: { label: 'Stable', color: 'bg-primary text-white' },
  READY_FOR_ADOPTION: { label: 'Ready for Adoption', color: 'bg-success text-white' },
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Sponsor an animal</h1>
        <p className="text-muted-foreground">Help rescued animals by sponsoring their care and recovery.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 justify-center flex-wrap animate-slide-up">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">No animals found in this category.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((animal, i) => {
          const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0)
          const cfg = STATUS_CONFIG[animal.status] ?? { label: animal.status, color: 'bg-secondary text-secondary-foreground' }

          return (
            <Card key={animal.id} className="overflow-hidden group hover:shadow-md transition-all animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-48 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                {animal.photos[0] ? (
                  <Image
                    src={animal.photos[0]}
                    alt={animal.name ?? animal.species}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <Heart className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {animal.name ?? `Unnamed ${animal.species}`}
                  </h2>
                  <Badge className={cfg.color}>{cfg.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground capitalize">{animal.species}</p>
              </CardHeader>
              <CardContent className="pb-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total expenses</span>
                  <span className="font-semibold text-foreground">₹{totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active sponsors</span>
                  <span className="font-semibold text-foreground">{animal._count.sponsorships}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full flex items-center justify-center gap-2">
                  <Link href={`/adopt/${animal.id}`}>
                    <Heart className="h-4 w-4" />
                    Sponsor now
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
