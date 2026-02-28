import { auth } from '@/lib/auth'
import ReportWizard from './_components/report-wizard'

export default async function ReportPage() {
  await auth() // ensure session is established (Auth0 cookie sync)
  return <ReportWizard />
}

