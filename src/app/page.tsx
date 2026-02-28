import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Heart } from 'lucide-react'
import { HeroSection } from './_components/hero-section'
import { StatsSection } from './_components/stats-section'
import { StepsSection } from './_components/steps-section'
import { FeaturesSection } from './_components/features-section'
import { NGOCTASection, CitizensCTASection } from './_components/cta-sections'

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
    { label: 'Total Reports', rawValue: totalReports, icon: 'clipboard' },
    { label: 'Animals Rescued', rawValue: animalsRescued, suffix: '+', icon: 'heart' },
    { label: 'Active NGOs', rawValue: activeNGOs, icon: 'building' },
    { label: 'Monthly Sponsors', rawValue: activeSponsors, icon: 'users' },
  ]

  const features = [
    { icon: 'alert', title: 'AI Urgency Scoring', desc: 'Gemini Vision classifies injury severity instantly so NGOs prioritize critical cases first.' },
    { icon: 'activity', title: 'NGO Dashboard', desc: 'Real-time case queue, field worker dispatch, and live tracking — all in one place.' },
    { icon: 'shield', title: 'Digital Health Passport', desc: 'QR-linked medical records follow every rescued animal through treatment and beyond.' },
    { icon: 'heart', title: 'Virtual Adoption', desc: 'Sponsor animals from ₹299/month. See health updates and know your impact.' },
    { icon: 'map', title: 'Predictive Hotspots', desc: 'ML clustering of incident zones helps NGOs pre-position resources where needed most.' },
    { icon: 'trending', title: 'Full Transparency', desc: 'Public expense ledgers and health updates build donor trust and accountability.' },
  ]

  const steps = [
    {
      step: '01', icon: 'smartphone', title: 'Citizen Reports',
      desc: 'Snap a photo, add description and GPS. Our AI scores urgency in under 3 seconds.',
    },
    {
      step: '02', icon: 'truck', title: 'NGO Responds',
      desc: 'Nearest verified NGO gets a real-time alert. Field worker is dispatched immediately.',
    },
    {
      step: '03', icon: 'heart', title: 'Animal Recovers',
      desc: 'Health passport created, vet care tracked, sponsor support assigned — full recovery loop.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* ── Header + Hero (animated client component) ── */}
      <HeroSection user={user} />

      {/* ── Stats Bar (animated client component) ── */}
      <StatsSection stats={stats} />

      {/* ── How It Works (animated client component) ── */}
      <StepsSection steps={steps} />

      {/* ── Features Grid (animated client component) ── */}
      <FeaturesSection features={features} />

      {/* ── NGO CTA (animated client component) ── */}
      <NGOCTASection />

      {/* ── Citizens CTA (animated client component) ── */}
      <CitizensCTASection />

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <span className="font-bold text-white text-xl">rescure</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Real-time rescue. Transparent care. Every animal counts.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <div className="space-y-2 text-sm">
                {[
                  { href: '/community', label: 'Community' },
                  { href: '/adopt', label: 'Adopt' },
                  { href: '/marketplace', label: 'Marketplace' },
                  { href: '/api-docs', label: 'API Docs' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Services</h4>
              <div className="space-y-2 text-sm">
                {[
                  { href: '/report', label: 'Report Emergency' },
                  { href: '/surge', label: 'Surge Mode' },
                  { href: '/hotspots', label: 'Hotspot Map' },
                  { href: '/impact', label: 'Impact Dashboard' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <span>📞</span>
                  <span>(213) 555 - 8742</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>rescue@rescure.org</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} RESCURE · Built for animals in need</p>
            <div className="flex gap-4">
              <Link href="/api-docs" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/api-docs" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

