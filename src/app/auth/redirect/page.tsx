import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Post-login redirect hub.
 * Reads the user's role and sends them to their designated home.
 * Login page uses ?callbackUrl=/auth/redirect as default.
 */
export default async function AuthRedirectPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // New Google users must select their user type before proceeding
  if (session.isNewUser) {
    redirect('/onboarding')
  }

  const role = (session.user as { role?: string }).role

  switch (role) {
    case 'NGO_WORKER':
      redirect('/worker/dashboard')
    case 'NGO_ADMIN':
      redirect('/dashboard')
    case 'VETERINARIAN':
      redirect('/vet/dashboard')
    case 'SUPPLIER':
      redirect('/supplier/dashboard')
    case 'PLATFORM_ADMIN':
      redirect('/admin/dashboard')
    case 'CITIZEN':
    default:
      // Citizens return to the homepage
      redirect('/')
  }
}
