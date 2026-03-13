import { redirect } from 'next/navigation'
import { createClient, createAdmin } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  type RawApp = {
    id: string; user_id: string; submitted_at: string | null; review_notes: string | null
    profiles: { display_name: string | null; email: string | null } | null
    cities: { name: string } | null
    driver_documents: Array<{ id: string; document_type: string; file_path: string; uploaded_at: string }>
  }

  const { data: rawData } = await supabase
    .from('driver_applications')
    .select(`
      id, user_id, status, submitted_at, review_notes,
      profiles!user_id ( display_name, email ),
      cities!city_id ( name ),
      driver_documents ( id, document_type, file_path, uploaded_at )
    `)
    .eq('status', 'in_review')
    .order('submitted_at', { ascending: true })

  const applications = rawData as unknown as RawApp[] | null
  const userIds = (applications ?? []).map(a => a.user_id)

  const { data: driverProfiles } = userIds.length > 0
    ? await supabase.from('driver_profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: null }
  const dpByUser = new Map((driverProfiles ?? []).map(dp => [dp.user_id, dp.display_name]))

  // Generate signed URLs for documents; fetch email/name from auth when profiles has nulls
  type DocWithUrl = { id: string; document_type: string; uploaded_at: string; signedUrl: string }
  type AppWithDocs = {
    id: string; userId: string; submitted_at: string | null; review_notes: string | null
    driverName: string; driverEmail: string; cityName: string
    documents: DocWithUrl[]
  }

  const admin = createAdmin()

  const enriched: AppWithDocs[] = await Promise.all(
    (applications ?? []).map(async (app) => {
      const rawProfile = app.profiles
      const rawCity = app.cities
      const rawDocs = app.driver_documents

      let driverEmail = rawProfile?.email ?? ''
      let authUser: { user?: { email?: string; user_metadata?: Record<string, unknown> } } | null = null
      if (!driverEmail || !rawProfile?.display_name) {
        const res = await admin.auth.admin.getUserById(app.user_id)
        authUser = res.data as { user?: { email?: string; user_metadata?: Record<string, unknown> } } | null
        if (!driverEmail) driverEmail = authUser?.user?.email ?? ''
      }

      const meta = authUser?.user?.user_metadata as Record<string, unknown> | undefined
      const metaName = typeof meta?.display_name === 'string' ? meta.display_name : typeof meta?.full_name === 'string' ? meta.full_name : null
      const driverName =
        rawProfile?.display_name ??
        dpByUser.get(app.user_id) ??
        metaName ??
        (driverEmail ? driverEmail.split('@')[0] : null) ??
        'Unknown'

      const docsWithUrls: DocWithUrl[] = await Promise.all(
        rawDocs.map(async (doc) => {
          const { data } = await supabase.storage.from('driver-documents').createSignedUrl(doc.file_path, 3600)
          return { id: doc.id, document_type: doc.document_type, uploaded_at: doc.uploaded_at, signedUrl: data?.signedUrl ?? '' }
        })
      )

      return {
        id: app.id,
        userId: app.user_id,
        submitted_at: app.submitted_at,
        review_notes: app.review_notes,
        driverName,
        driverEmail,
        cityName: rawCity?.name ?? '',
        documents: docsWithUrls,
      }
    })
  )

  return <AdminClient applications={enriched} adminId={user.id} />
}
