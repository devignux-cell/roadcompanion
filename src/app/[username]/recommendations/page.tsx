import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MOCK_EVENTS } from '@/lib/data/events.mock'
import { COLORS } from '@/lib/constants/colors'
import type { Event } from '@/types/events'
import type { CityPick } from '@/lib/supabase/types'
import type { RecommendationItem, RecFilter } from '@/types/recommendations'
import RecommendationsClient from './RecommendationsClient'

// ─── Ticketmaster types ───────────────────────────────────────────────────────

interface TMImage { url: string; ratio: string; width: number }
interface TMClassification { segment?: { name: string } }
interface TMEvent {
  id: string; name: string
  dates?: { start?: { dateTime?: string; localDate?: string } }
  _embedded?: { venues?: Array<{ name: string }> }
  images?: TMImage[]; url?: string; classifications?: TMClassification[]
}
interface TMResponse { _embedded?: { events?: TMEvent[] } }

function classificationToMeta(c: TMClassification[] | undefined) {
  const seg = c?.[0]?.segment?.name ?? ''
  if (seg === 'Music') return { type: 'Music', emoji: '🎵', color: COLORS.purple }
  if (seg === 'Sports') return { type: 'Sports', emoji: '🏆', color: COLORS.accent }
  if (seg === 'Arts & Theatre') return { type: 'Arts', emoji: '🎭', color: COLORS.teal }
  if (seg === 'Film') return { type: 'Film', emoji: '🎬', color: COLORS.gold }
  return { type: 'Event', emoji: '🎟️', color: COLORS.muted }
}

function pickBestImage(images: TMImage[] | undefined): string | null {
  if (!images?.length) return null
  const wide = images.filter(img => img.ratio === '16_9' && img.width >= 640)
  if (wide.length) return wide.reduce((b, i) => (i.width > b.width ? i : b)).url
  const anyWide = images.filter(img => img.ratio === '16_9')
  return anyWide[0]?.url ?? images[0]?.url ?? null
}

function formatDate(dateTime: string | undefined, localDate: string | undefined): string {
  if (localDate) {
    const [, month, day] = localDate.split('-')
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(month)]} ${parseInt(day)}`
  }
  return dateTime
    ? new Date(dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'TBD'
}

async function getEvents(city: string): Promise<{ events: Event[]; isLive: boolean }> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) return { events: MOCK_EVENTS, isLive: false }
  const stateCode = city === 'Boston' ? 'MA' : 'FL'
  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json')
    url.searchParams.set('apikey', apiKey)
    url.searchParams.set('city', city)
    url.searchParams.set('stateCode', stateCode)
    url.searchParams.set('countryCode', 'US')
    url.searchParams.set('size', '12')
    url.searchParams.set('sort', 'date,asc')
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error()
    const data: TMResponse = await res.json()
    const tmEvents = data._embedded?.events ?? []
    const events: Event[] = tmEvents.map(ev => {
      const { type, emoji, color } = classificationToMeta(ev.classifications)
      return {
        id: ev.id, title: ev.name,
        date: formatDate(ev.dates?.start?.dateTime, ev.dates?.start?.localDate),
        dateIso: ev.dates?.start?.localDate ?? ev.dates?.start?.dateTime ?? '',
        venue: ev._embedded?.venues?.[0]?.name ?? city,
        type, emoji, color, imageUrl: pickBestImage(ev.images),
        ticketUrl: ev.url ?? null, isLive: true,
      }
    })
    return { events: events.length ? events : MOCK_EVENTS, isLive: events.length > 0 }
  } catch {
    return { events: MOCK_EVENTS, isLive: false }
  }
}

// ─── City pick → RecommendationItem ──────────────────────────────────────────

const PICK_META: Record<CityPick['category'], { emoji: string; color: string }> = {
  food:      { emoji: '🍔', color: COLORS.accent },
  nightlife: { emoji: '🍸', color: COLORS.purple },
  stay:      { emoji: '🏨', color: COLORS.gold },
  activity:  { emoji: '🎭', color: COLORS.teal },
  transport: { emoji: '🚗', color: COLORS.muted },
}

function pickToItem(pick: CityPick): RecommendationItem {
  const { emoji, color } = PICK_META[pick.category]
  const tags: RecFilter[] = ['All']
  if (pick.category === 'food') tags.push('Food')
  if (pick.category === 'nightlife') tags.push('Bars')
  if (pick.category === 'activity') tags.push('Gems')
  return {
    id: pick.id, kind: 'place',
    title: pick.title, detail: pick.description ?? '',
    meta: pick.category, badge: pick.category, emoji, color,
    imageUrl: pick.image_url, tags, href: pick.external_url ?? null,
    desc: pick.description ?? undefined,
  }
}

function eventToItem(event: Event): RecommendationItem {
  const tags: RecFilter[] = ['All', 'Events']
  if (event.type === 'Music') tags.push('Music', 'Festivals')
  if (event.type === 'Sports') tags.push('Sports')
  if (event.type === 'Arts') tags.push('Festivals')
  return {
    id: event.id, kind: 'event', title: event.title, detail: event.date,
    meta: event.venue, badge: event.type, emoji: event.emoji, color: event.color,
    imageUrl: event.imageUrl, tags, href: event.ticketUrl,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { events, isLive } = await getEvents('Tampa')
    return <RecommendationsClient items={events.map(eventToItem)} isLive={isLive} username={username} driverProfileId={null} />
  }

  const supabase = await createClient()

  const { data: rawDriver } = await supabase
    .from('driver_profiles')
    .select('id, city_id')
    .eq('public_url_slug', username)
    .eq('is_published', true)
    .single()

  if (!rawDriver) notFound()
  const driver = rawDriver as { id: string; city_id: string }

  const { data: rawCity } = await supabase.from('cities').select('name').eq('id', driver.city_id).single()
  const cityName = (rawCity as { name: string } | null)?.name ?? 'Tampa'

  const [{ data: rawPicks }, { events, isLive }] = await Promise.all([
    supabase.from('city_picks').select('*').eq('city_id', driver.city_id).eq('is_active', true).order('sort_order'),
    getEvents(cityName),
  ])

  const picks = (rawPicks ?? []) as CityPick[]
  const items: RecommendationItem[] = [
    ...events.map(eventToItem),
    ...picks.map(pickToItem),
  ]

  return <RecommendationsClient items={items} isLive={isLive} username={username} driverProfileId={driver.id} />
}
