import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, ShoppingCart } from 'lucide-react'
import UserMenu from '@/components/layout/user-menu'
import MarketplaceClient from './_components/marketplace-client'

export const metadata = { title: 'Marketplace — RESCURE' }

export default async function MarketplacePage() {
  const session = await auth()
  const sessionUser = session?.user as {
    id?: string; name?: string | null; image?: string | null; role?: string
  } | undefined

  const user = sessionUser
    ? { id: sessionUser.id ?? null, name: sessionUser.name ?? null, image: sessionUser.image ?? null, role: sessionUser.role ?? null }
    : null

  const products = await prisma.product.findMany({
    where: { active: true, supplier: { verified: true } },
    include: { supplier: { select: { name: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const serialised = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

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
              { href: '/api-docs', label: 'ABOUT' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  l.href === '/marketplace' ? 'text-primary' : 'text-gray-700 hover:text-primary'
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
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-5 py-2.5 rounded-full border border-primary/20 mb-6 animate-fade-in">
            <ShoppingCart className="h-4 w-4" />
            MARKETPLACE
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-fade-in">Rescue Supplies</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
            Quality supplies for animal rescue — NGOs get special pricing on every product.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <MarketplaceClient products={serialised} />
        </div>
      </section>
    </main>
  )
}
