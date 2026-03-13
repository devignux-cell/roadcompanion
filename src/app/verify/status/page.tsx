import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusClient from './StatusClient'

export default async function VerifyStatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: application }, { data: documents }] = await Promise.all([
    supabase
      .from('driver_applications')
      .select('status, submitted_at, reviewed_at, review_notes')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('driver_documents')
      .select('document_type, uploaded_at, status')
      .eq('user_id', user.id),
  ])

  if (!application) redirect('/signup/driver')
  if (application.status === 'approved') redirect('/dashboard')

  return <StatusClient application={application} documents={documents ?? []} userId={user.id} />
}
