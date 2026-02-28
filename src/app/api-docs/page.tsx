import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, Code2, Key, Globe, Zap, Mail, Clock, BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import UserMenu from '@/components/layout/user-menu'

export const metadata: Metadata = {
  title: 'API Documentation — RESCURE',
  description: 'Public REST API documentation for the RESCURE platform',
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/incidents',
    description: 'List recent incident reports. Filter by urgency level.',
    params: '?limit=20&offset=0&urgency=HIGH',
    example: `{
  "data": [
    {
      "id": "clxxx...",
      "lat": 19.076,
      "lng": 72.877,
      "urgencyLevel": "HIGH",
      "status": "ASSIGNED",
      "createdAt": "2026-02-28T10:00:00.000Z",
      "address": "Andheri West, Mumbai"
    }
  ],
  "total": 142,
  "page": 0
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/animals',
    description: 'List animals available for adoption or in care.',
    params: '?status=READY_FOR_ADOPTION&limit=20',
    example: `{
  "data": [
    {
      "id": "clyyy...",
      "name": "Bruno",
      "species": "dog",
      "breed": "Indie",
      "status": "READY_FOR_ADOPTION",
      "publicSlug": "bruno-indie-2026",
      "photo": "https://cdn.example.com/bruno.jpg",
      "intakeDate": "2026-01-15T00:00:00.000Z"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/ngos',
    description: 'List all verified NGOs on the platform.',
    params: '',
    example: `{
  "data": [
    {
      "id": "clzzz...",
      "name": "Paws of Hope",
      "city": "Mumbai",
      "state": "Maharashtra",
      "logo": "https://cdn.example.com/logo.png",
      "activeCaseCount": 12
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Platform-wide statistics. No authentication required.',
    params: '',
    example: `{
  "totalIncidents": 1842,
  "totalRescued": 1203,
  "totalAnimals": 654,
  "activeNGOs": 38,
  "totalSponsors": 210
}`,
  },
]

export default async function ApiDocsPage() {
  const session = await auth()
  const sessionUser = session?.user as {
    id?: string; name?: string | null; image?: string | null; role?: string
  } | undefined

  const user = sessionUser
    ? { id: sessionUser.id ?? null, name: sessionUser.name ?? null, image: sessionUser.image ?? null, role: sessionUser.role ?? null }
    : null

  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/logo.png" alt="RESCURE" width={40} height={40} className="rounded-full transition-transform group-hover:scale-105" />
            <span className="font-bold text-2xl text-gray-900 tracking-tight">rescure</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/', label: 'HOME' },
              { href: '/community', label: 'COMMUNITY' },
              { href: '/adopt', label: 'ADOPT' },
              { href: '/marketplace', label: 'MARKETPLACE' },
              { href: '/api-docs', label: 'API DOCS' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  l.href === '/api-docs' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors">Login</Link>
                <Link href="/report" className="text-sm font-bold bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Report Animal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="pt-32 pb-16 px-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full border border-primary/20 mb-6 animate-fade-in">
            <Code2 className="h-4 w-4" />
            PUBLIC API
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">
            RESCURE Public API
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Integrate RESCURE rescue data into your applications with our REST API.
          </p>
        </div>
      </section>

      {/* ── Auth & Base URL Cards ── */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Key className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Authentication</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              API access requires an <strong className="text-gray-900">Enterprise subscription</strong>. Contact us to get your API key.
            </p>
            <p className="text-sm text-gray-600">
              Pass your API key in the <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs">Authorization</code> header:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm overflow-x-auto">
              {`Authorization: Bearer YOUR_API_KEY`}
            </pre>
          </div>

          {/* Base URL Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-4 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Base URL</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              All API endpoints are served from the following base URL. Use HTTPS for all requests.
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-sm overflow-x-auto">
              {`https://rescure.app`}
            </pre>

            {/* Rate Limits inline */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-bold text-gray-900">Rate Limits</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-extrabold text-gray-900">120</p>
                  <p className="text-xs text-gray-500">requests / min</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-extrabold text-gray-900">50K</p>
                  <p className="text-xs text-gray-500">requests / day</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Endpoints ── */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Endpoints</h2>
          </div>

          <div className="space-y-6">
            {endpoints.map((ep, i) => (
              <div
                key={ep.path}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all animate-scale-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="p-6 space-y-4">
                  {/* Method + path */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-extrabold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wide">
                      {ep.method}
                    </span>
                    <code className="font-mono text-sm text-gray-800 font-semibold">
                      {ep.path}
                      {ep.params && <span className="text-gray-400">{ep.params}</span>}
                    </code>
                  </div>

                  <p className="text-sm text-gray-600">{ep.description}</p>

                  {/* Example */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Example Response</p>
                    <pre className="bg-gray-900 text-gray-100 rounded-xl p-5 font-mono text-xs overflow-x-auto leading-relaxed">
                      {ep.example}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-5">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need API Access?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              API access requires an Enterprise subscription. Get your key and start building today.
            </p>
            <a
              href="mailto:api@rescure.app"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
