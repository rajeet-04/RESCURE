import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UserMenu from '@/components/layout/user-menu'
import PawSplash from '@/components/landing/paw-splash'
import HeroFloatingCards from '@/components/landing/hero-floating-cards'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Heart, TrendingUp, Building2, Users, AlertCircle, Activity, Shield, MapPin, Smartphone, Truck, CheckCircle, Phone, Mail, ArrowRight, Github, Twitter, Instagram } from 'lucide-react'

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
    { label: 'Total Reports', value: totalReports.toLocaleString('en-IN'), icon: 'clipboard' },
    { label: 'Animals Rescued', value: animalsRescued.toLocaleString('en-IN'), icon: 'heart' },
    { label: 'Active NGOs', value: activeNGOs.toLocaleString('en-IN'), icon: 'building' },
    { label: 'Monthly Sponsors', value: activeSponsors.toLocaleString('en-IN'), icon: 'users' },
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

  // Icon mapping function
  const getIcon = (iconName: string, className: string = 'h-5 w-5') => {
    const icons: Record<string, React.ReactNode> = {
      clipboard: <Activity className={className} />,
      heart: <Heart className={className} />,
      building: <Building2 className={className} />,
      users: <Users className={className} />,
      alert: <AlertCircle className={className} />,
      activity: <Activity className={className} />,
      shield: <Shield className={className} />,
      map: <MapPin className={className} />,
      trending: <TrendingUp className={className} />,
      smartphone: <Smartphone className={className} />,
      truck: <Truck className={className} />,
      check: <CheckCircle className={className} />,
    }
    return icons[iconName] || null
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ── Paw Splash Intro ── */}
      <PawSplash />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/logo.png" alt="RESCURE" width={40} height={40} className="rounded-full transition-transform group-hover:scale-105" />
            <span className="font-bold text-2xl text-gray-900 tracking-tight">rescure</span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/', label: 'HOME' },
              { href: '/community', label: 'COMMUNITY' },
              { href: '/adopt', label: 'ADOPT' },
              { href: '/marketplace', label: 'MARKETPLACE' },
              { href: '/api-docs', label: 'API & PRICING' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors tracking-wide"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/report"
                  className="text-sm font-bold bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Report Animal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full border border-primary/20">
                <Heart className="h-4 w-4" fill="currentColor" />
                TRUSTED RESCUE FOR EVERY ANIMAL
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                Expert Rescue for
                <span className="block mt-2">Strays and Injured Animals</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                From emergency reporting and AI triage to vet care and adoption, we're here to help every animal get the care they need, every day.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/report"
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white text-base font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-all shadow-md hover:shadow-lg group"
                >
                  REPORT EMERGENCY
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/adopt"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 text-base font-bold px-8 py-4 rounded-full border-2 border-gray-900 hover:bg-gray-50 transition-all group"
                >
                  EXPLORE SERVICES
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative lg:block hidden animate-scale-in">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/rescure_hero.png"
                  alt="Rescure — Stray animal rescue in action"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 0px, 50vw"
                />
              </div>

              {/* ── Floating Cycling Cards ── */}
              <HeroFloatingCards />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 120}>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    {getIcon(s.icon, 'h-6 w-6 text-primary')}
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">HOW IT WORKS</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Three Steps to Save a Life</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Our streamlined process ensures every reported animal gets immediate attention</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 150}>
              <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all group">
                <div className="absolute -top-5 left-8 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {i + 1}
                </div>
                <div className="flex justify-center mb-6 pt-2">
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    {getIcon(s.icon, 'h-10 w-10 text-primary')}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-3 text-center">{s.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{s.desc}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">PLATFORM FEATURES</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Built for Rescue Teams</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Comprehensive tools designed to maximize rescue efficiency and animal welfare</p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
              <div className="bg-gray-50 rounded-2xl p-8 hover:bg-primary/5 hover:shadow-md transition-all group border border-transparent hover:border-primary/20">
                <div className="flex justify-center mb-5">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
                    {getIcon(f.icon, 'h-7 w-7 text-primary')}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3 text-center">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed text-center">{f.desc}</p>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NGO CTA ── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
          <div className="bg-primary rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">Partner With Us</h2>
              <p className="text-white/90 mb-4 max-w-2xl mx-auto text-lg leading-relaxed">
                Get a free rescue management dashboard, real-time incident alerts, verified vet network, and discounted supplier access.
              </p>
              <p className="text-sm text-white/70 mb-10">Free tier available · Pro and Enterprise plans for growing teams</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=ngo"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all shadow-lg group"
                >
                  Join Free
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/api-docs#pricing"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold px-10 py-4 rounded-full border-2 border-white/30 hover:bg-white/20 transition-all group backdrop-blur-sm"
                >
                  View Pricing
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-white/10 rounded-full group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Citizens CTA ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">FOR CITIZENS</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Every Report Saves a Life</h2>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
              Spotted an injured animal? Report in under 60 seconds. Your location, photo, and description instantly routes help.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {[
              { icon: <Smartphone className="h-10 w-10 text-primary" />, label: 'Take a photo' },
              { icon: <MapPin className="h-10 w-10 text-primary" />, label: 'Share location' },
              { icon: <Truck className="h-10 w-10 text-primary" />, label: 'Help dispatched' },
            ].map((s, i) => (
              <ScrollReveal key={s.label} delay={i * 100}>
              <div className="bg-gray-50 rounded-2xl p-8 hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                <div className="flex justify-center mb-4">{s.icon}</div>
                <div className="font-bold text-gray-900 text-lg">{s.label}</div>
              </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={200}>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-10 py-4 rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group"
          >
            REPORT NOW
            <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-full group-hover:translate-x-1 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative bg-gray-950 text-gray-400 overflow-hidden">
        {/* Gradient accent stripe */}
        <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-teal-400" />

        {/* Decorative blurred shapes */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Newsletter CTA strip */}
        <div className="relative border-b border-gray-800/60">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Stay in the loop</h3>
              <p className="text-sm text-gray-500">Get updates on rescues, features, and community milestones.</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-72 bg-gray-900 border border-gray-800 rounded-l-full px-5 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
              />
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-r-full text-sm font-bold transition-all active:scale-[0.98] flex items-center gap-2 shrink-0">
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-12 gap-10 mb-14">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2.5 mb-5">
                <Image src="/logo.png" alt="RESCURE" width={44} height={44} className="rounded-full shadow-lg shadow-primary/20" />
                <span className="font-bold text-white text-2xl tracking-tight">rescure</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
                Real-time rescue. Transparent care. Every animal counts. Connecting citizens, NGOs, and vets across India.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {[
                  { icon: Twitter, href: '#', label: 'Twitter' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Github, href: '#', label: 'GitHub' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl bg-gray-800/60 hover:bg-primary/20 flex items-center justify-center text-gray-500 hover:text-primary transition-all"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="md:col-span-2">
              <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Platform</h4>
              <div className="space-y-3 text-sm">
                {[
                  { href: '/community', label: 'Community' },
                  { href: '/adopt', label: 'Adopt' },
                  { href: '/marketplace', label: 'Marketplace' },
                  { href: '/api-docs', label: 'API and Pricing' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-gray-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="md:col-span-3">
              <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Services</h4>
              <div className="space-y-3 text-sm">
                {[
                  { href: '/report', label: 'Report Emergency' },
                  { href: '/surge', label: 'Surge Mode' },
                  { href: '/hotspots', label: 'Hotspot Map' },
                  { href: '/impact', label: 'Impact Dashboard' },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-gray-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="md:col-span-3">
              <h4 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Contact</h4>
              <div className="space-y-4 text-sm">
                <a href="tel:+918240587044" className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-gray-800/60 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                    <Phone className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                  +91 82405 87044
                </a>
                <a href="mailto:rescue@rescure.org" className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-gray-800/60 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                    <Mail className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                  contact@rescure.org
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p className="flex items-center gap-1.5">
              © {new Date().getFullYear()} RESCURE · Built with
              <Heart className="h-3 w-3 text-primary inline" fill="currentColor" />
              for animals in need
            </p>
            <div className="flex gap-6">
              <Link href="/api-docs" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <Link href="/api-docs" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
              <Link href="/api-docs" className="hover:text-gray-400 transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

