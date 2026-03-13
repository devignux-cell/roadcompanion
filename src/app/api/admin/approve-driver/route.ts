import { createClient } from '@/lib/supabase/server'
import { createAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { applicationId, driverUserId, action, reviewNotes } = await req.json() as {
    applicationId: string
    driverUserId: string
    action: 'approve' | 'reject'
    reviewNotes: string
  }

  const admin = createAdmin()
  const now = new Date().toISOString()

  if (action === 'approve') {
    // Promote role to driver
    await admin.from('profiles').update({ role: 'driver', updated_at: now }).eq('id', driverUserId)

    // Update application status
    await admin.from('driver_applications').update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: user.id,
      review_notes: reviewNotes || null,
    }).eq('id', applicationId)
  } else {
    // Reject — role stays guest
    await admin.from('driver_applications').update({
      status: 'rejected',
      review_notes: reviewNotes,
      reviewed_at: now,
      reviewed_by: user.id,
    }).eq('id', applicationId)
  }

  return new Response('ok', { status: 200 })
}
