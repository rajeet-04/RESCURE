import { auth0 } from '@/lib/auth0'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

// Get the current authenticated session (wraps Auth0 + database lookup)
export async function auth() {
  try {
    const session = await auth0.getSession()
    if (!session) return null

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    // First-time login — provision user in DB
    if (!user) {
      user = await syncUserWithDatabase(session.user)
    }

    if (!user) return null

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role as Role,
      },
    }
  } catch {
    return null
  }
}

// Redirect to Auth0 login
export async function signIn(_provider?: string, options?: { redirectTo?: string }) {
  'use server'
  const returnTo = options?.redirectTo ?? '/auth/redirect'
  redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
}

// Redirect to Auth0 logout
export async function signOut() {
  'use server'
  redirect('/auth/logout')
}

// Upsert Auth0 user into Prisma
export async function syncUserWithDatabase(auth0User: {
  email?: string
  name?: string
  picture?: string
  [key: string]: unknown
}) {
  const email = auth0User.email
  const name = (auth0User.name as string) || email?.split('@')[0]
  const image = auth0User.picture as string | undefined

  if (!email) throw new Error('No email provided from Auth0')

  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    return prisma.user.create({
      data: { email, name, image, role: 'Citizen' as Role },
    })
  }

  return prisma.user.update({
    where: { email },
    data: { name, image },
  })
}
