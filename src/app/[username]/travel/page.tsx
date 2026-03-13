import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import TravelCard from '@/components/ui/TravelCard'
import { TRAVEL_LINKS } from '@/lib/data/travel'
import { COLORS } from '@/lib/constants/colors'
import { createClient } from '@/lib/supabase/server'
import type { TravelHelpLink } from '@/lib/supabase/types'
import type { TravelLink } from '@/types/events'

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('per_page', '1')
    url.searchParams.set('orientation', 'landscape')
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.urls?.regular ?? null
  } catch {
    return null
  }
}

const HELP_CATEGORY_META: Record<TravelHelpLink['category'], { emoji: string; color: string }> = {
  stay:       { emoji: '🏨', color: COLORS.gold },
  booking:    { emoji: '✈️', color: COLORS.teal },
  transport:  { emoji: '🚌', color: COLORS.muted },
  tourism:    { emoji: '🗺️', color: COLORS.purple },
  emergency:  { emoji: '🚨', color: COLORS.accent },
}

export default async function TravelPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  let helpLinks: TravelHelpLink[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const { data: rawDriver } = await supabase
      .from('driver_profiles')
      .select('city_id')
      .eq('public_url_slug', username)
      .eq('is_published', true)
      .single()

    if (!rawDriver) notFound()
    const driver = rawDriver as { city_id: string }

    const { data: rawLinks } = await supabase
      .from('travel_help_links')
      .select('*')
      .eq('city_id', driver.city_id)
      .eq('is_active', true)
      .order('sort_order')

    helpLinks = (rawLinks ?? []) as TravelHelpLink[]
  }

  const linksWithImages: TravelLink[] = await Promise.all(
    TRAVEL_LINKS.map(async link => ({
      ...link,
      imageUrl: (await fetchUnsplashImage(link.unsplashQuery)) ?? link.imageUrl,
    }))
  )

  // Separate emergency links to always show first
  const emergencyLinks = helpLinks.filter(l => l.category === 'emergency')
  const regularLinks = helpLinks.filter(l => l.category !== 'emergency')

  return (
    <PageWrapper>
      <div style={{ padding: '24px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Link
            href={`/${username}`}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, textDecoration: 'none', color: COLORS.text, flexShrink: 0,
            }}
          >
            ←
          </Link>
          <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>Travel Help</div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800 }}>
            Plan Your Stay
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
            Handpicked travel resources
          </div>
        </div>

        {/* Emergency contacts — always first */}
        {emergencyLinks.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: COLORS.accent, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
              Emergency & Safety
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {emergencyLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card-hover" style={{
                    background: COLORS.card, border: `1px solid ${COLORS.accent}30`,
                    borderRadius: 16, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>🚨</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{link.title}</div>
                      {link.description && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{link.description}</div>}
                    </div>
                    <span style={{ color: COLORS.muted, fontSize: 14 }}>→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* City-specific local resources */}
        {regularLinks.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
              Local Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {regularLinks.map(link => {
                const { emoji, color } = HELP_CATEGORY_META[link.category]
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div className="card-hover" style={{
                      background: COLORS.card, border: `1px solid ${COLORS.border}`,
                      borderRadius: 16, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: color + '18', border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                      }}>
                        {emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{link.title}</div>
                        {link.description && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{link.description}</div>}
                      </div>
                      <span style={{ color: COLORS.muted, fontSize: 14 }}>→</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Affiliate booking links */}
        {(regularLinks.length > 0 || emergencyLinks.length > 0) && (
          <div style={{ fontSize: 10, letterSpacing: 2.5, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
            Book Your Trip
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {linksWithImages.map((link, i) => (
            <TravelCard key={link.id} link={link} index={i} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: COLORS.muted }}>
          Some links may earn a commission · FTC-compliant disclosure
        </div>
      </div>
    </PageWrapper>
  )
}
