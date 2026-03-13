"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('display_name').eq('id', user.id).single()
        .then(({ data }) => setDisplayName(data?.display_name ?? ''))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <PageWrapper>
      <div style={{ padding: '0 0 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>
            Roam<span style={{ color: COLORS.accent }}>Companion</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 100,
              padding: '7px 14px', fontSize: 12, fontWeight: 600, color: COLORS.muted,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, textAlign: 'center', marginBottom: 8 }}>
            Welcome back{displayName ? `, ${displayName}` : ''}
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 48, textAlign: 'center' }}>Choose your dashboard</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            {/* Rides */}
            <div
              className="card-hover"
              onClick={() => router.push('/driver/edit-profile')}
              style={{
                background: COLORS.card, border: `1px solid ${COLORS.accent}30`,
                borderRadius: 24, padding: '28px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 20,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 18, background: COLORS.accent + '18', border: `1px solid ${COLORS.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                🚗
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Rides</div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>Manage your driver profile &amp; QR</div>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 20 }}>→</div>
            </div>

            {/* Homes — coming soon */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 20, opacity: 0.45 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: COLORS.purple + '18', border: `1px solid ${COLORS.purple}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                🏠
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Homes</div>
                <div style={{ fontSize: 13, color: COLORS.muted }}>Short-term rental management</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.purple, background: COLORS.purple + '20', border: `1px solid ${COLORS.purple}40`, borderRadius: 100, padding: '4px 10px', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
