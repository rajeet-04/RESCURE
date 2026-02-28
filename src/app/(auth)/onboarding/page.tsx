import type { Metadata } from 'next'
import OnboardingWizard from './_components/onboarding-wizard'

export const metadata: Metadata = {
  title: 'Get Started — RESCURE',
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-orange-50 py-12">
      <OnboardingWizard />
    </main>
  )
}
