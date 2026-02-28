import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Register — RESCURE' }

const ROLES = [
  { value: 'citizen', label: 'Citizen', emoji: '👤', desc: 'Report strays, sponsor animals', onboardPath: '/report' },
  { value: 'ngo', label: 'NGO', emoji: '🏥', desc: 'Manage rescues & team', onboardPath: '/onboarding' },
  { value: 'vet', label: 'Veterinarian', emoji: '🩺', desc: 'Provide telehealth consultations', onboardPath: '/vet/onboarding' },
  { value: 'supplier', label: 'Supplier', emoji: '📦', desc: 'Sell food & medicine to NGOs', onboardPath: '/supplier/onboarding' },
]

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🐾</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Join RESCURE</h1>
          <p className="text-gray-500 text-sm mt-1">Choose how you want to help</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {ROLES.map((r) => (
            <a
              key={r.value}
              href={`/login?callbackUrl=${r.onboardPath}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer hover:border-orange-400 hover:bg-orange-50 ${
                searchParams.role === r.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200'
              }`}
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="font-semibold text-gray-900 text-sm">{r.label}</span>
              <span className="text-xs text-gray-500 text-center leading-tight">{r.desc}</span>
            </a>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400">
          Already registered?{' '}
          <a href="/login" className="text-orange-500 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  )
}
