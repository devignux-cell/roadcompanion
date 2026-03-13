"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'
import { createClient } from '@/lib/supabase/client'
import LoadingScreen from '@/components/ui/LoadingScreen'

const VIDEO_SRC = '/videos/roam-commercial.mp4'
const MIN_LOADING_MS = 3000

const inputStyle: React.CSSProperties = {
  background: 'rgba(19,19,26,0.85)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: '14px 16px',
  fontSize: 15,
  color: COLORS.text,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function LoginForm({ showBack = false }: { showBack?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const handleCreateAccount = () => {
    setShowLoading(true)
    setTimeout(() => {
      router.push('/signup/driver')
    }, MIN_LOADING_MS)
  }

  if (showLoading) return <LoadingScreen />

  return (
    <>
      {/* Fullscreen video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2,
          pointerEvents: 'none',
        }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      {/* Dark gradient overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: `linear-gradient(
            to bottom,
            rgba(10, 10, 20, 0.55) 0%,
            rgba(10, 10, 20, 0.70) 40%,
            rgba(10, 10, 20, 0.88) 75%,
            rgba(10, 10, 20, 0.97) 100%
          )`,
          pointerEvents: 'none',
        }}
      />

      <PageWrapper fullWidth>
        <div style={{ width: '100%', maxWidth: 500, margin: 'auto', padding: '24px 24px 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {showBack && (
            <Link href="/" style={{ position: 'absolute', top: 24, left: 24, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.muted, textDecoration: 'none' }}>
              ← Back
            </Link>
          )}

          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 24,
              marginBottom: 8,
              whiteSpace: 'nowrap',
            }}>
              Roam<span style={{ color: COLORS.accent }}>Companion</span>
            </div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>Driver sign in</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />

            {error && (
              <div style={{ fontSize: 13, color: COLORS.accent, textAlign: 'center', animation: 'fadeUp 0.2s ease' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                background: COLORS.accent, border: 'none', borderRadius: 14, padding: '16px',
                fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: loading || !email || !password ? 'default' : 'pointer',
                marginTop: 4, opacity: loading || !email || !password ? 0.5 : 1,
                transition: 'opacity 0.2s', fontFamily: 'inherit',
                width: '100%',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleCreateAccount}
              style={{
                background: 'none',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: '16px',
                fontSize: 15,
                fontWeight: 600,
                color: COLORS.muted,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Create Driver Account
            </button>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
