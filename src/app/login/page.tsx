import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/app/LoginForm'

export default async function LoginPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <LoginForm showBack />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return <LoginForm showBack />
}
