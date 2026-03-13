import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <>{children}</>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: application } = await supabase
    .from('driver_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (!application) redirect('/signup/driver')
  if (application.status !== 'approved') redirect('/verify/status')

  return <>{children}</>
}
