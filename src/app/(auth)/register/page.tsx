import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Building2, Stethoscope, ShoppingCart, ArrowRight, Heart } from 'lucide-react'

export const metadata: Metadata = { title: 'Register — RESCURE' }

const ROLES = [
  {
    value: 'citizen',
    label: 'Citizen',
    icon: Users,
    desc: 'Report strays, sponsor animals',
    onboardPath: '/report',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    hoverBorder: 'hover:border-blue-400 hover:bg-blue-50/60',
    activeBorder: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'ngo',
    label: 'NGO',
    icon: Building2,
    desc: 'Manage rescues & team',
    onboardPath: '/onboarding',
    color: 'text-primary',
    bg: 'bg-primary/10',
    hoverBorder: 'hover:border-primary hover:bg-primary/5',
    activeBorder: 'border-primary bg-primary/5',
  },
  {
    value: 'vet',
    label: 'Veterinarian',
    icon: Stethoscope,
    desc: 'Provide telehealth consultations',
    onboardPath: '/vet/onboarding',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-400 hover:bg-emerald-50/60',
    activeBorder: 'border-emerald-500 bg-emerald-50',
  },
  {
    value: 'supplier',
    label: 'Supplier',
    icon: ShoppingCart,
    desc: 'Sell food & medicine to NGOs',
    onboardPath: '/supplier/onboarding',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    hoverBorder: 'hover:border-amber-400 hover:bg-amber-50/60',
    activeBorder: 'border-amber-500 bg-amber-50',
  },
]

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden">
          {/* Top accent stripe */}
          <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-teal-400" />

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
                <Image
                  src="/logo.png"
                  alt="RESCURE"
                  width={44}
                  height={44}
                  className="rounded-full shadow-md shadow-primary/20 group-hover:scale-105 transition-transform"
                />
                <span className="font-bold text-2xl text-gray-900 tracking-tight">rescure</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
              <p className="text-gray-500">Choose your role to get started</p>
            </div>

            {/* Role Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {ROLES.map((r) => {
                const Icon = r.icon
                const isActive = searchParams.role === r.value
                return (
                  <Link
                    key={r.value}
                    href={`/login?callbackUrl=${r.onboardPath}`}
                    className={`group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                      isActive ? r.activeBorder : `border-gray-150 bg-gray-50/50 ${r.hoverBorder}`
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.bg} transition-transform group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${r.color}`} strokeWidth={1.75} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm mb-1">{r.label}</p>
                      <p className="text-xs text-gray-500 leading-snug">{r.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-primary" fill="currentColor" />
                  Every animal counts
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:scale-[0.99] group"
            >
              Continue with Google
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Footer */}
            <p className="text-sm text-center text-gray-400 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Below card note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          By continuing you agree to our{' '}
          <Link href="/api-docs" className="underline hover:text-gray-600 transition-colors">Terms</Link>{' '}
          &amp;{' '}
          <Link href="/api-docs" className="underline hover:text-gray-600 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </main>
  )
}
