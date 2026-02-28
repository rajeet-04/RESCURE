import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Role } from '@prisma/client'

// Route → required role(s)
const PROTECTED_ROUTES: Record<string, Role[]> = {
  '/ngo':      ['NGO_ADMIN', 'NGO_WORKER'],
  '/worker':   ['NGO_WORKER'],
  '/vet':      ['VETERINARIAN'],
  '/supplier': ['SUPPLIER'],
  '/admin':    ['PLATFORM_ADMIN'],
}

export default auth((req: NextRequest & { auth: { user?: { role?: Role } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Find matching protected prefix
  const match = Object.entries(PROTECTED_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  )

  if (!match) return NextResponse.next()

  const [, allowedRoles] = match

  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role as Role
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/ngo/:path*',
    '/worker/:path*',
    '/vet/:path*',
    '/supplier/:path*',
    '/admin/:path*',
  ],
}
