import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DriverProfile } from '@/lib/supabase/types'
import TipClient from './TipClient'

interface TipEntry {
  name: string; handle: string; icon: string; color: string; url: string
}

function buildTips(dp: Pick<DriverProfile, 'tip_cashapp' | 'tip_venmo' | 'tip_paypal'>): TipEntry[] {
  const entries: TipEntry[] = []
  if (dp.tip_cashapp) entries.push({ name: 'Cash App', handle: `$${dp.tip_cashapp}`, icon: '💚', color: '#00D632', url: `https://cash.app/$${dp.tip_cashapp}` })
  if (dp.tip_venmo)   entries.push({ name: 'Venmo',    handle: `@${dp.tip_venmo.replace('@', '')}`, icon: '💙', color: '#3D95CE', url: `https://venmo.com/${dp.tip_venmo.replace('@', '')}` })
  if (dp.tip_paypal)  entries.push({ name: 'PayPal',   handle: dp.tip_paypal, icon: '💛', color: '#FFB700', url: `https://paypal.me/${dp.tip_paypal}` })
  return entries
}

export default async function TipPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <TipClient username={username} tips={[]} />
  }

  const supabase = await createClient()
  const { data: rawDp } = await supabase
    .from('driver_profiles')
    .select('tip_cashapp, tip_venmo, tip_paypal')
    .eq('public_url_slug', username)
    .eq('is_published', true)
    .single()

  if (!rawDp) notFound()
  const dp = rawDp as Pick<DriverProfile, 'tip_cashapp' | 'tip_venmo' | 'tip_paypal'>

  return <TipClient username={username} tips={buildTips(dp)} />
}
