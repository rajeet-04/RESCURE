'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Search } from 'lucide-react'

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  IN_TREATMENT: { label: 'In Treatment', bg: 'bg-amber-100', text: 'text-amber-700' },
  STABLE: { label: 'Stable', bg: 'bg-blue-100', text: 'text-blue-700' },
  READY_FOR_ADOPTION: { label: 'Ready to Adopt', bg: 'bg-green-100', text: 'text-green-700' },
}

const BASE_TABS = [
  { key: 'all', label: 'All Animals', icon: null },
  { key: 'care', label: 'Needs Care', icon: null },
  { key: 'adopt', label: 'Ready to Adopt', icon: null },
]

export default function AdoptClient({
  animals,
  myAnimalIds = [],
  loggedIn = false,
}: {
  animals: AnimalItem[]
  myAnimalIds?: string[]
  loggedIn?: boolean
}) {
  const [tab, setTab] = useState('all')

  const TABS = [
    ...BASE_TABS,
    ...(loggedIn ? [{ key: 'mine', label: 'My Adoptions', icon: Heart }] : []),
  ]

  const filtered = animals.filter((a) => {
    if (tab === 'care') return a.status === 'IN_TREATMENT' || a.status === 'STABLE'
    if (tab === 'adopt') return a.status === 'READY_FOR_ADOPTION'
    if (tab === 'mine') return myAnimalIds.includes(a.id)
    return true
  })

  return (
    <div className="space-y-10">
      {/* Filter Tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon
          const isMine = t.key === 'mine'
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === t.key
                  ? isMine
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                    : 'bg-primary text-white shadow-sm shadow-primary/25'
                  : isMine
                    ? 'bg-white text-rose-500 hover:bg-rose-50 border border-rose-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" fill={tab === t.key ? 'currentColor' : 'none'} />}
              {t.label}
              {isMine && myAnimalIds.length > 0 && (
                <span className={`ml-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-500'
                }`}>
                  {myAnimalIds.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 ${
            tab === 'mine' ? 'bg-rose-50' : 'bg-primary/10'
          }`}>
            {tab === 'mine'
              ? <Heart className="w-10 h-10 text-rose-300" />
              : <Search className="w-10 h-10 text-primary" />
            }
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">
            {tab === 'mine' ? 'No sponsorships yet' : 'No animals found'}
          </p>
          <p className="text-gray-500 mb-6">
            {tab === 'mine'
              ? 'Start sponsoring an animal to track them here.'
              : 'Try a different filter or check back later for new rescues.'}
          </p>
          <Link
            href={tab === 'mine' ? '/adopt' : '/report'}
            onClick={() => tab === 'mine' && setTab('all')}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {tab === 'mine' ? 'Browse Animals' : 'Report an Animal'}
          </Link>
        </div>
      )}

      {/* Animal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((animal, i) => {
          const totalExpenses = animal.expenses.reduce((s, e) => s + e.amount, 0)
          const cfg = STATUS_CONFIG[animal.status] ?? { label: animal.status, bg: 'bg-gray-100', text: 'text-gray-700' }

          return (
            <div
              key={animal.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all animate-scale-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Photo */}
              <div className="h-52 relative bg-gray-50 flex items-center justify-center overflow-hidden">
                {animal.photos[0] ? (
                  <Image
                    src={animal.photos[0]}
                    alt={animal.name ?? animal.species}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <Heart className="h-14 w-14 text-gray-200" />
                )}
                {/* Status badge overlay */}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900 truncate mb-1">
                  {animal.name ?? `Unnamed ${animal.species}`}
                </h2>
                <p className="text-sm text-gray-500 capitalize mb-4">{animal.species}</p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Total expenses</p>
                    <p className="font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Sponsors</p>
                    <p className="font-bold text-gray-900">{animal._count.sponsorships}</p>
                  </div>
                </div>

                <Link
                  href={`/adopt/${animal.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-[0.98] group/btn"
                >
                  <Heart className="h-4 w-4" />
                  Sponsor Now
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-white/20 rounded-full group-hover/btn:translate-x-0.5 transition-transform">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
