import { Role } from '@prisma/client'
import { Claims } from '@auth0/nextjs-auth0'

declare module '@auth0/nextjs-auth0' {
  interface Session {
    user: Claims & {
      id: string
      role: Role
    }
  }
}
