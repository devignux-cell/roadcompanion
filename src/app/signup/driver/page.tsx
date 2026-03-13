import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DriverSignupStepper from './DriverSignupStepper'

export default async function SignupDriverPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <DriverSignupStepper cities={[]} initialStep={1} initialUserId={null} />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialStep = 1
  const initialUserId = user?.id ?? null

  if (user) {
    const { data: progress } = await supabase
      .from('driver_signup_progress')
      .select('current_step, is_complete')
      .eq('user_id', user.id)
      .single()

    if (progress?.is_complete) {
      const { data: app } = await supabase
        .from('driver_applications')
        .select('status')
        .eq('user_id', user.id)
        .single()
      redirect(app?.status === 'approved' ? '/dashboard' : '/verify/status')
    } else if (progress) {
      initialStep = Math.min(progress.current_step + 1, 7)
    }
  }

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .eq('is_active', true)

  return (
    <DriverSignupStepper
      cities={cities ?? []}
      initialStep={initialStep}
      initialUserId={initialUserId}
    />
  )
}
