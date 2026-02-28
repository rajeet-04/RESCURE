import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
]

// Only enable Resend if a real API key is configured
if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_...')) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM!,
    }) as never
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as { role: Role }).role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register',   // First-time users → role picker
  },
})
