"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import PageWrapper from '@/components/layout/PageWrapper'
import BackHeader from '@/components/ui/BackHeader'
import { COLORS } from '@/lib/constants/colors'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import type { DriverProfile } from '@/lib/supabase/types'

// ─── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ label, required, right }: { label: string; required?: boolean; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingLeft: 4 }}>
      <span style={{ fontSize: 12, color: COLORS.muted }}>
        {label}{required && <span style={{ color: COLORS.accent }}> *</span>}
      </span>
      {right}
    </div>
  )
}

const baseInput: React.CSSProperties = {
  background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14,
  padding: '13px 14px', fontSize: 14, color: COLORS.text, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

function TextInput({ label, value, onChange, placeholder, required, prefix }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; prefix?: string
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 14, pointerEvents: 'none' }}>{prefix}</span>}
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...baseInput, paddingLeft: prefix ? 28 : 14 }} />
      </div>
    </div>
  )
}

function TextareaInput({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <div>
      <FieldLabel label={label} right={maxLength ? <span style={{ fontSize: 11, color: value.length > maxLength * 0.85 ? COLORS.accent : COLORS.muted }}>{value.length}/{maxLength}</span> : undefined} />
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3}
        style={{ ...baseInput, resize: 'none', lineHeight: 1.6 }} />
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: 10, letterSpacing: 2.5, color: COLORS.muted, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, paddingLeft: 4 }}>{children}</div>
}

// ─── Copy icon ───────────────────────────────────────────────────────────────────
function CopyIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
}
function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function ExternalLinkIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
}

// ─── Landing page field ──────────────────────────────────────────────────────────
function LandingPageField({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const url = origin ? `${origin}/${slug}` : `/${slug}`
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <FieldLabel label="Your Landing Page" />
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, fontSize: 13, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{url}</div>
        <button onClick={handleCopy} style={{ background: copied ? COLORS.teal + '15' : 'none', border: `1px solid ${copied ? COLORS.teal + '40' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', padding: '5px 7px', display: 'flex', alignItems: 'center', color: copied ? COLORS.teal : COLORS.muted, transition: 'all 0.25s' }}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ border: '1px solid transparent', borderRadius: 8, padding: '5px 7px', display: 'flex', alignItems: 'center', color: COLORS.muted, textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = COLORS.text)} onMouseLeave={e => (e.currentTarget.style.color = COLORS.muted)}>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  )
}

// ─── QR Code section ─────────────────────────────────────────────────────────────
function QRCodeSection({ slug, displayName, id }: { slug: string; displayName: string; id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [origin, setOrigin] = useState('')
  const [copiedQr, setCopiedQr] = useState(false)
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const url = origin ? `${origin}/${slug}` : `/${slug}`

  useEffect(() => {
    if (!canvasRef.current || !origin) return
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 2, color: { dark: '#F0EDE8', light: '#13131A' } })
  }, [url, origin])

  const getDataUrl = () => canvasRef.current?.toDataURL('image/png') ?? null

  const handleCopyImage = async () => {
    const dataUrl = getDataUrl(); if (!dataUrl) return
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    setCopiedQr(true); setTimeout(() => setCopiedQr(false), 2000)
  }

  const handleDownload = () => {
    const dataUrl = getDataUrl(); if (!dataUrl) return
    const a = document.createElement('a'); a.href = dataUrl; a.download = `roamcompanion-qr-${slug}.png`; a.click()
  }

  const handleSavePdf = () => {
    const dataUrl = getDataUrl(); if (!dataUrl) return
    const win = window.open('', '_blank'); if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Roam Companion QR — ${displayName}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:20px;padding:40px}h1{font-size:22px;font-weight:800;letter-spacing:-.5px}h1 span{color:#FF5C28}img{width:220px;height:220px;border:1px solid #eee;border-radius:12px;padding:8px}p{font-size:13px;color:#888}.url{font-size:12px;color:#aaa;font-family:monospace}</style></head><body><h1>Roam<span>Companion</span></h1><img src="${dataUrl}" alt="QR Code"/><p>${displayName}</p><p class="url">${url}</p><script>window.onload=()=>{window.print()}<\/script></body></html>`)
    win.document.close()
  }

  const actionBtn: React.CSSProperties = { flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 8px', fontSize: 11, fontWeight: 600, color: COLORS.muted, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${COLORS.border}`, lineHeight: 0 }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</div>
        <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace', marginTop: 4, letterSpacing: 0.5 }}>
          ID: {id.slice(0, 8)} · @{slug}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button onClick={handleCopyImage} style={{ ...actionBtn, color: copiedQr ? COLORS.teal : COLORS.muted, border: `1px solid ${copiedQr ? COLORS.teal + '50' : COLORS.border}`, background: copiedQr ? COLORS.teal + '10' : COLORS.card }}>
          <span style={{ fontSize: 16 }}>{copiedQr ? '✓' : '📋'}</span>
          {copiedQr ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={handleDownload} style={actionBtn}><span style={{ fontSize: 16 }}>⬇️</span>Download</button>
        <button onClick={handleSavePdf} style={actionBtn}><span style={{ fontSize: 16 }}>🖨️</span>Print / PDF</button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function DriverEditProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [cityName, setCityName] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [cashapp, setCashapp] = useState('')
  const [venmo, setVenmo] = useState('')
  const [paypal, setPaypal] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: rawDp } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      const dp = rawDp as DriverProfile | null

      if (!dp) { router.push('/signup/driver'); return }

      const { data: city } = await supabase.from('cities').select('name').eq('id', dp.city_id).single()
      setProfile(dp)
      setCityName(city?.name ?? '')
      setDisplayName(dp.display_name ?? '')
      setBio(dp.bio ?? '')
      setAvatarPreview(dp.avatar_url)
      setCashapp(dp.tip_cashapp ?? '')
      setVenmo(dp.tip_venmo ?? '')
      setPaypal(dp.tip_paypal ?? '')
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!profile) return
    if (!displayName.trim()) { setError('Display name is required.'); return }
    if (!cashapp.trim() && !venmo.trim() && !paypal.trim()) { setError('At least one tip handle is required.'); return }
    setError(''); setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let avatarUrl = profile.avatar_url

    if (avatarFile) {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('userId', user.id)
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Avatar upload failed.'); setSaving(false); return }
      avatarUrl = data.publicUrl
      setAvatarFile(null)
    }

    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('driver_profiles').update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        tip_cashapp: cashapp.trim() || null,
        tip_venmo: venmo.trim() || null,
        tip_paypal: paypal.trim() || null,
        updated_at: now,
      }).eq('user_id', user.id),
      supabase.from('profiles').update({ display_name: displayName.trim(), avatar_url: avatarUrl, updated_at: now }).eq('id', user.id),
    ])

    setProfile(p => p ? { ...p, avatar_url: avatarUrl, display_name: displayName.trim() } : p)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profile) return null

  const slug = profile.public_url_slug ?? ''

  return (
    <PageWrapper>
      <div style={{ padding: '24px 16px 48px' }}>
        <BackHeader title="Edit Profile" onBack={() => router.push('/dashboard')} />

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '28px 0 32px', gap: 8 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: 84, height: 84, borderRadius: '50%', background: COLORS.card, border: `2px solid ${COLORS.accent}40`, overflow: 'hidden', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarPreview
              ? <Image src={avatarPreview} alt={displayName || 'Profile'} width={84} height={84} style={{ objectFit: 'cover', objectPosition: '20% 28%', width: '100%', height: '100%' }} unoptimized />
              : <span style={{ fontSize: 36 }}>👤</span>}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: 11, color: COLORS.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Tap to change photo</button>
          <div style={{ fontSize: 12, color: COLORS.muted }}>@{slug}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionLabel>Your Page</SectionLabel>
          {slug && <LandingPageField slug={slug} />}

          <SectionLabel>QR Code</SectionLabel>
          {slug && <QRCodeSection slug={slug} displayName={displayName} id={profile.id} />}

          <SectionLabel>Profile</SectionLabel>
          <TextInput label="Display Name" value={displayName} onChange={setDisplayName} placeholder="e.g. Carlos V." required />

          {/* City — read-only */}
          <div>
            <FieldLabel label="City" />
            <div style={{ ...baseInput, color: COLORS.muted, opacity: 0.7 }}>{cityName || 'Not set'}</div>
          </div>

          <TextareaInput label="Bio" value={bio} onChange={setBio} placeholder="Tell passengers about yourself…" maxLength={300} />

          <SectionLabel>Tip Handles</SectionLabel>
          <TextInput label="Cash App" value={cashapp} onChange={setCashapp} placeholder="YourHandle" prefix="$" />
          <TextInput label="Venmo" value={venmo} onChange={setVenmo} placeholder="YourHandle" prefix="@" />
          <TextInput label="PayPal" value={paypal} onChange={setPaypal} placeholder="YourHandle" />

          {error && (
            <div style={{ fontSize: 13, color: COLORS.accent, textAlign: 'center', animation: 'fadeUp 0.2s ease', paddingTop: 4 }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{ background: saved ? 'transparent' : COLORS.accent, border: saved ? `1px solid ${COLORS.teal}60` : 'none', borderRadius: 16, padding: '16px', fontSize: 15, fontWeight: 700, color: saved ? COLORS.teal : '#fff', cursor: saving ? 'default' : 'pointer', marginTop: 16, transition: 'all 0.3s ease', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
            {saved ? '✓  Saved!' : saving ? 'Saving…' : 'Save Changes'}
          </button>

          <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '14px', fontSize: 14, color: COLORS.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign Out
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
