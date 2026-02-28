import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PawCivic — Stray Animal Rescue Platform',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-xl text-orange-600">PawCivic</span>
        </div>
        <nav className="flex gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">
            Login
          </Link>
          <Link
            href="/report"
            className="text-sm font-medium bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
          >
            Report Animal
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>🇮🇳</span> Civic infrastructure for stray animal welfare
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Every stray animal deserves<br />
          <span className="text-orange-500">immediate rescue</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Report injured strays in one tap. Connect with nearby NGOs in real time.
          Sponsor animals you care about monthly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/report"
            className="bg-orange-500 text-white text-lg font-semibold px-8 py-4 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            🚨 Report an Animal Now
          </Link>
          <Link
            href="/adopt"
            className="bg-white text-orange-600 text-lg font-semibold px-8 py-4 rounded-2xl border-2 border-orange-200 hover:border-orange-400 transition-colors"
          >
            💙 Sponsor an Animal
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '📍', title: 'Instant Reporting', desc: 'One-tap report with GPS + AI injury scoring. Works offline too.' },
          { icon: '🏥', title: 'NGO Network', desc: 'Real-time routing to nearest verified rescue NGOs with live tracking.' },
          { icon: '🐕', title: 'Digital Health Passport', desc: 'Every rescued animal gets a QR-linked health record and expense ledger.' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* NGO CTA */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Are you an NGO?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Get a free rescue management dashboard, access to verified vets, and
            discounted food &amp; medicine suppliers.
          </p>
          <Link
            href="/register?role=ngo"
            className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-orange-600 transition-colors inline-block"
          >
            Join as NGO — Free
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400 border-t mt-8">
        © {new Date().getFullYear()} PawCivic · Built for stray animals across India
      </footer>
    </main>
  )
}
