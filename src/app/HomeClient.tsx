"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'
import type { DriverData } from './[username]/page'

interface WeatherData {
  temp: number
  condition: string
  emoji: string
}

interface HomeClientProps {
  weather: WeatherData
  username: string
  driverData: DriverData | null
}

const PAYMENTS = [
  { name: 'CashApp', color: '#00D632' },
  { name: 'Venmo', color: '#3D95CE' },
  { name: 'PayPal', color: '#FFB700' },
]

function RecsIcon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>🍔</span>
        <span style={{ fontSize: 13, lineHeight: 1 }}>🎭</span>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>⚽</span>
        <span style={{ fontSize: 13, lineHeight: 1 }}>🏖️</span>
      </div>
    </div>
  )
}

export default function HomeClient({ weather, username, driverData }: HomeClientProps) {
  const [mounted, setMounted] = useState(false)

  const TILES = [
    { label: 'Games', icon: '🎮' as string | null, href: `/${username}/games`, color: COLORS.accent, subtitle: 'Trivia · Leaderboard', delay: 0 },
    { label: 'Recommendations', icon: null, href: `/${username}/recommendations`, color: COLORS.teal, subtitle: 'Food · Events · Spots', delay: 60 },
    { label: 'Stay', icon: '✈️' as string | null, href: `/${username}/travel`, color: COLORS.gold, subtitle: 'Hotels · Flights', delay: 120 },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <PageWrapper>
      <div style={{ padding: '0 0 40px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 12px' }}>
          <Link href="/" style={{ fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: -0.3, color: 'inherit', textDecoration: 'none' }}>
            Roam<span style={{ color: COLORS.accent }}>Companion</span>
          </Link>
        </div>

        {/* Hero */}
        <div style={{ padding: '36px 24px 32px', textAlign: 'center', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {/* Profile pic */}
          <div style={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', margin: '0 auto 20px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: `conic-gradient(${COLORS.accent}, ${COLORS.gold}, ${COLORS.accent})`, animation: 'spin 6s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: COLORS.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {driverData?.avatarUrl
                ? <Image src={driverData.avatarUrl} alt={driverData.displayName} width={84} height={84} style={{ objectFit: 'cover', objectPosition: '20% 28%', width: '100%', height: '100%' }} />
                : <span style={{ fontSize: 36 }}>👤</span>}
            </div>
          </div>

          <div style={{ fontSize: 11, letterSpacing: 3, color: COLORS.accent, fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>Welcome aboard</div>
          <div style={{ fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800, fontSize: 24, lineHeight: 1.2, marginBottom: 12 }}>
            Hi, I&apos;m <span style={{ color: COLORS.accent }}>{driverData?.displayName ?? username}</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.75, maxWidth: 280, margin: '0 auto' }}>
            {driverData?.bio ?? "Sit back and enjoy the ride — play trivia, discover Tampa's best spots, check out local events, and more."}
          </div>
        </div>

        {/* Weather badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(45,255,199,0.08)', border: '1px solid rgba(45,255,199,0.2)', borderRadius: 100, padding: '8px 16px', fontSize: 12, color: COLORS.teal }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.teal, animation: 'pulse 2s infinite' }} />
            Tampa right now: {weather.emoji} {weather.temp}°F · {weather.condition}
          </div>
        </div>

        {/* 3-col tiles */}
        <div style={{ padding: '0 16px', display: 'flex', gap: 8, marginBottom: 12 }}>
          {TILES.map(tile => (
            <Link key={tile.href} href={tile.href} style={{ textDecoration: 'none', flex: 1 }}>
              <div className="card-hover" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '16px 8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: `opacity 0.5s ease ${tile.delay}ms, transform 0.5s ease ${tile.delay}ms` }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: tile.color + '18', border: `1px solid ${tile.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tile.icon ? 22 : undefined }}>
                  {tile.icon ?? <RecsIcon />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{tile.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, lineHeight: 1.4 }}>{tile.subtitle}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tip card */}
        <div style={{ padding: '0 16px' }}>
          <Link href={`/${username}/tip`} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease 180ms, transform 0.5s ease 180ms' }}>
              <div style={{ fontSize: 28 }}>☕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>Buy my coffee</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {PAYMENTS.map(p => (
                    <span key={p.name} style={{ fontSize: 10, fontWeight: 700, color: p.color, background: p.color + '15', border: `1px solid ${p.color}30`, borderRadius: 100, padding: '3px 8px' }}>{p.name}</span>
                  ))}
                </div>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 16 }}>→</div>
            </div>
          </Link>
        </div>

        {/* 5-star section */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ background: `linear-gradient(145deg, ${COLORS.card} 60%, rgba(245,200,66,0.06))`, border: '1px solid rgba(245,200,66,0.18)', borderRadius: 24, padding: '32px 24px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease 240ms, transform 0.5s ease 240ms' }}>
            <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 180, height: 100, borderRadius: '50%', background: 'rgba(245,200,66,0.1)', filter: 'blur(32px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20, position: 'relative' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} style={{ fontSize: 30, animation: `starPulse 2.2s ease-in-out ${i * 130}ms infinite`, display: 'inline-block' }}>⭐</span>
              ))}
            </div>
            <div style={{ fontFamily: "'Syne', var(--font-syne), sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1.2, marginBottom: 6, position: 'relative' }}>Enjoyed your ride?</div>
            <div style={{ fontSize: 16, color: COLORS.gold, fontWeight: 700, marginBottom: 10, position: 'relative' }}>A 5 Star from a Star!</div>
            <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.7, position: 'relative' }}>Your rating makes a real difference.<br />Thank you for riding with me. 🙏</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: COLORS.muted }}>
          Some links may earn a commission · Tips appreciated, never expected
        </div>
      </div>
    </PageWrapper>
  )
}
