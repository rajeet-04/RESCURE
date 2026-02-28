import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Stub: real impl would need a SurgeVolunteer table
  return NextResponse.json({ message: 'Thank you for volunteering!' })
}
