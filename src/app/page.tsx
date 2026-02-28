import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UserMenu from '@/components/layout/user-menu'

export const metadata: Metadata = {
  title: 'RESCURE — Stray Animal Rescue Platform',
  description: 'AI-powered platform connecting citizens, NGOs and vets for real-time stray animal rescue across India.',
}

export default async function HomePage() {
  const session = await auth()
  const sessionUser = session?.user as {
    id?: string; name?: string | null; image?: string | null; role?: string
  } | undefined

  // Serializable plain object for client component
  const user = sessionUser
    ? {
        id: sessionUser.id ?? null,
        name: sessionUser.name ?? null,
        image: sessionUser.image ?? null,
        role: sessionUser.role ?? null,
      }
    : null

  // Fetch platform stats server-side
  const [totalReports, animalsRescued, activeNGOs, activeSponsors] = await Promise.all([
    prisma.incidentReport.count(),
    prisma.rescueCase.count({ where: { state: 'RESCUED' } }),
    prisma.nGO.count({ where: { verified: true } }),
    prisma.sponsorship.count({ where: { active: true } }),
  ]).catch(() => [0, 0, 0, 0])

  const stats = [
    { label: 'Total Reports', value: totalReports.toLocaleString('en-IN'), icon: '📋' },
    { label: 'Animals Rescued', value: animalsRescued.toLocaleString('en-IN'), icon: '🐾' },
    { label: 'Active NGOs', value: activeNGOs.toLocaleString('en-IN'), icon: '🏥' },
    { label: 'Monthly Sponsors', value: activeSponsors.toLocaleString('en-IN'), icon: '💙' },
  ]

  const features = [
    { icon: '📍', title: 'AI Urgency Scoring', desc: 'Gemini Vision classifies injury severity instantly so NGOs prioritize critical cases first.' },
    { icon: '🏥', title: 'NGO Dashboard', desc: 'Real-time case queue, field worker dispatch, and live tracking — all in one place.' },
    { icon: '🐾', title: 'Digital Health Passport', desc: 'QR-linked medical records follow every rescued animal through treatment and beyond.' },
    { icon: '💙', title: 'Virtual Adoption', desc: 'Sponsor animals from ₹299/month. See health updates and know your impact.' },
    { icon: '🗺️', title: 'Predictive Hotspots', desc: 'ML clustering of incident zones helps NGOs pre-position resources where needed most.' },
    { icon: '📊', title: 'Full Transparency', desc: 'Public expense ledgers and health updates build donor trust and accountability.' },
  ]

  const steps = [
    {
      step: '01', icon: '📱', title: 'Citizen Reports',
      desc: 'Snap a photo, add description and GPS. Our AI scores urgency in under 3 seconds.',
    },
    {
      step: '02', icon: '🚐', title: 'NGO Responds',
      desc: 'Nearest verified NGO gets a real-time alert. Field worker is dispatched immediately.',
    },
    {
      step: '03', icon: '❤️', title: 'Animal Recovers',
      desc: 'Health passport created, vet care tracked, sponsor support assigned — full recovery loop.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🐾</span>
            <span className="font-extrabold text-xl text-orange-600 tracking-tight">RESCURE</span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: '/community', label: 'Community' },
              { href: '/adopt', label: 'Adopt' },
              { href: '/marketplace', label: 'Marketplace' },
              { href: '/api-docs', label: 'About' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:border-orange-400 hover:text-orange-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/report"
                  className="text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Report Animal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-20 bg-gradient-to-b from-orange-50 via-amber-50/40 to-white overflow-hidden">
        {/* Decorative floating cards */}
        <div className="absolute top-16 left-8 text-4xl animate-bounce hidden lg:block" style={{ animationDuration: '3s' }}>🐕</div>
        <div className="absolute top-32 right-10 text-3xl animate-bounce hidden lg:block" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🐱</div>
        <div className="absolute bottom-24 left-16 text-3xl animate-bounce hidden lg:block" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>🐄</div>

        <div className="max-w-3xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-orange-200">
            <span>🇮🇳</span> Powering stray animal rescue across India
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Rescue.
            </span>{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
              Recover.
            </span>{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              Reunite.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered platform connecting citizens, NGOs and vets for real-time stray animal rescue
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/report"
              className="bg-orange-500 text-white text-base font-bold px-8 py-4 rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0"
            >
              🚨 Report an Animal
            </Link>
            <Link
              href="/adopt"
              className="bg-white text-orange-600 text-base font-bold px-8 py-4 rounded-2xl border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              Browse Animals to Sponsor
            </Link>
          </div>

          <p className="text-sm text-gray-400 font-medium">
            10,000+ animals rescued · 200+ NGOs · Free to use
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gray-900 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-2">The Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">How RESCURE Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="relative bg-orange-50 rounded-2xl p-7 border border-orange-100">
                <span className="absolute top-5 right-5 text-6xl font-black text-orange-100 select-none leading-none">
                  {s.step}
                </span>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Everything rescue teams need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NGO CTA ── */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 text-9xl opacity-5 select-none leading-none">🏥</div>
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-3">For NGOs</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Are you an Animal Rescue NGO?</h2>
            <p className="text-gray-300 mb-3 max-w-xl mx-auto text-base">
              Get a free rescue management dashboard, real-time incident alerts, verified vet network, and discounted supplier access.
            </p>
            <p className="text-sm text-orange-300 mb-8">Free tier available · Pro and Enterprise plans for growing NGOs</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=ngo"
                className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Join Free
              </Link>
              <Link
                href="/api-docs#pricing"
                className="bg-white/10 text-white font-bold px-8 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Citizens CTA ── */}
      <section className="py-16 px-4 sm:px-6 bg-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">For Citizens</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Every report you make matters</h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto">
            Spotted an injured animal? Report in under 60 seconds. Your location, photo and description instantly routes help to the animal.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-sm">
            {[
              { icon: '📸', label: 'Take a photo' },
              { icon: '📍', label: 'Share location' },
              { icon: '🚐', label: 'NGO dispatched' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-gray-800">{s.label}</div>
              </div>
            ))}
          </div>
          <Link
            href="/report"
            className="inline-block bg-orange-500 text-white font-bold px-10 py-4 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:-translate-y-0.5"
          >
            🚨 Make a Report Now
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🐾</span>
                <span className="font-extrabold text-white text-lg">RESCURE</span>
              </div>
              <p className="text-sm">Real-time rescue. Transparent care. Every animal counts.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { href: '/api-docs', label: 'About' },
                { href: '/community', label: 'Community' },
                { href: '/api-docs', label: 'API Docs' },
                { href: '/surge', label: 'Surge Mode' },
                { href: '/hotspots', label: 'Hotspot Map' },
              ].map((l) => (
                <Link key={l.href + l.label} href={l.href} className="hover:text-orange-400 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-sm text-center">
            <p>© {new Date().getFullYear()} RESCURE · Built with ❤️ for animals in India</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

