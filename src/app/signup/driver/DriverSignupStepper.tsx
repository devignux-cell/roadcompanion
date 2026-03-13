"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'
import { createClient } from '@/lib/supabase/client'
import type { DocumentType } from '@/lib/supabase/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface City { id: string; name: string }

interface UploadedDoc {
  type: Exclude<DocumentType, 'insurance'>
  file: File
  uploadedPath: string | null
}

interface SignupDraft {
  email: string; password: string; fullName: string
  cityId: string
  displayName: string; avatarFile: File | null; avatarUrl: string | null; avatarPreview: string | null; bio: string
  vehicleType: DriverProfile['vehicle_type']; yearsDriving: string; languages: string[]
  headline: string; heroFile: File | null; heroUrl: string | null; heroPreview: string | null; publicUrlSlug: string; serviceArea: string
  tipCashapp: string; tipVenmo: string; tipPaypal: string
  documents: UploadedDoc[]
}

type DriverProfile = {
  vehicle_type: 'sedan' | 'suv' | 'van' | 'luxury' | 'other' | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7
const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'French', 'Creole', 'Mandarin', 'Arabic']
const VEHICLE_TYPES: Array<{ value: NonNullable<DriverProfile['vehicle_type']>; label: string }> = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'other', label: 'Other' },
]

const DEFAULT_DRAFT: SignupDraft = {
  email: '', password: '', fullName: '',
  cityId: '',
  displayName: '', avatarFile: null, avatarUrl: null, avatarPreview: null, bio: '',
  vehicleType: null, yearsDriving: '', languages: [],
  headline: '', heroFile: null, heroUrl: null, heroPreview: null, publicUrlSlug: '', serviceArea: '',
  tipCashapp: '', tipVenmo: '', tipPaypal: '',
  documents: [],
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: '13px 16px',
  fontSize: 15,
  color: COLORS.text,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: COLORS.muted,
  marginBottom: 6,
  paddingLeft: 4,
  display: 'block',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: COLORS.accent }}> *</span>}</label>
      {children}
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, loading, children }: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: COLORS.accent, border: 'none', borderRadius: 14,
        padding: '16px', width: '100%', fontSize: 15, fontWeight: 700,
        color: '#fff', cursor: disabled || loading ? 'default' : 'pointer',
        opacity: disabled || loading ? 0.55 : 1, transition: 'opacity 0.2s',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading ? (
        <span
          style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        children
      )}
    </button>
  )
}

function GhostBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 14,
        padding: '14px', width: '100%', fontSize: 14, color: COLORS.muted,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function DriverSignupStepper({
  cities, initialStep, initialUserId,
}: {
  cities: City[]
  initialStep: number
  initialUserId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(initialStep)
  const [userId, setUserId] = useState<string | null>(initialUserId)
  const [draft, setDraft] = useState<SignupDraft>(DEFAULT_DRAFT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  // Slug availability debounce
  useEffect(() => {
    const slug = draft.publicUrlSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!slug) { setSlugAvailable(null); return }

    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('public_url_slug', slug)
        .single()
      setSlugAvailable(data === null)
    }, 500)
    return () => clearTimeout(t)
  }, [draft.publicUrlSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof SignupDraft>(k: K, v: SignupDraft[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const saveProgress = async (completedStep: number, uid: string) => {
    await supabase
      .from('driver_signup_progress')
      .upsert({ user_id: uid, current_step: completedStep, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  const handleError = (msg: string) => { setError(msg); setLoading(false) }

  // ── Step handlers ────────────────────────────────────────────────────────────

  const handleStep1 = async () => {
    if (!draft.email || !draft.password || !draft.fullName) return handleError('All fields are required.')
    if (draft.password.length < 8) return handleError('Password must be at least 8 characters.')

    setLoading(true); setError('')
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=/signup/driver`
      : undefined
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: draft.email,
      password: draft.password,
      options: {
        data: { display_name: draft.fullName },
        emailRedirectTo: redirectTo,
      },
    })
    if (signUpError) return handleError(signUpError.message)
    const uid = data.user!.id
    setUserId(uid)

    if (!data.session) {
      setLoading(false)
      setAwaitingEmailConfirmation(true)
      return
    }

    const { error: progressError } = await supabase
      .from('driver_signup_progress')
      .insert({ user_id: uid, current_step: 1 })
    if (progressError) {
      setLoading(false)
      return handleError(`Progress save failed: ${progressError.message}. Check: auth trigger exists, profiles row created, RLS allows insert.`)
    }
    setLoading(false)
    setStep(2)
  }

  const handleStep2 = async () => {
    if (!draft.cityId) return handleError('Please select your city.')
    if (!userId) return handleError('Session expired. Please refresh.')

    setLoading(true); setError('')
    await supabase
      .from('driver_profiles')
      .upsert({ user_id: userId, city_id: draft.cityId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    await saveProgress(2, userId)
    setLoading(false); setStep(3)
  }

  const handleStep3 = async () => {
    if (!draft.displayName || !draft.bio) return handleError('Display name and bio are required.')
    if (!userId) return handleError('Session expired. Please refresh.')

    setLoading(true); setError('')
    let avatarUrl = draft.avatarUrl

    if (draft.avatarFile) {
      const formData = new FormData()
      formData.append('file', draft.avatarFile)
      formData.append('userId', userId)
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) return handleError(data.error ?? 'Avatar upload failed. Use JPEG, PNG, or WebP (max 2MB).')
      avatarUrl = data.publicUrl
      set('avatarUrl', data.publicUrl)
    }

    await Promise.all([
      supabase.from('driver_profiles').update({
        display_name: draft.displayName, avatar_url: avatarUrl, bio: draft.bio, updated_at: new Date().toISOString(),
      }).eq('user_id', userId),
      supabase.from('profiles').update({ display_name: draft.displayName, avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', userId),
    ])
    await saveProgress(3, userId)
    setLoading(false); setStep(4)
  }

  const handleStep4 = async (skip = false) => {
    if (!userId) return handleError('Session expired.')
    setLoading(true); setError('')
    if (!skip) {
      await supabase.from('driver_profiles').update({
        vehicle_type: draft.vehicleType,
        years_driving: draft.yearsDriving ? parseInt(draft.yearsDriving) : null,
        languages: draft.languages.length > 0 ? draft.languages : null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }
    await saveProgress(4, userId)
    setLoading(false); setStep(5)
  }

  const handleStep5 = async () => {
    const slug = draft.publicUrlSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!draft.headline || !slug) return handleError('Headline and URL slug are required.')
    if (slugAvailable === false) return handleError('That URL slug is taken. Try another.')
    if (!userId) return handleError('Session expired.')

    setLoading(true); setError('')
    let heroUrl = draft.heroUrl

    if (draft.heroFile) {
      const path = `${userId}/hero.${draft.heroFile.name.split('.').pop() ?? 'jpg'}`
      const { error: upErr } = await supabase.storage.from('driver-images').upload(path, draft.heroFile, { upsert: true })
      if (upErr) return handleError('Hero image upload failed. Try again.')
      const { data: { publicUrl } } = supabase.storage.from('driver-images').getPublicUrl(path)
      heroUrl = publicUrl
      set('heroUrl', publicUrl)
    }

    await supabase.from('driver_profiles').update({
      headline: draft.headline, hero_image_url: heroUrl,
      public_url_slug: slug, service_area: draft.serviceArea || null, updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
    await saveProgress(5, userId)
    setLoading(false); setStep(6)
  }

  const handleStep6 = async (skip = false) => {
    if (!userId) return handleError('Session expired.')
    setLoading(true); setError('')
    if (!skip) {
      await supabase.from('driver_profiles').update({
        tip_cashapp: draft.tipCashapp || null,
        tip_venmo: draft.tipVenmo || null,
        tip_paypal: draft.tipPaypal || null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }
    await saveProgress(6, userId)
    setLoading(false); setStep(7)
  }

  const handleStep7 = async () => {
    const hasRideshare = draft.documents.some(d => d.type === 'uber_driver_screenshot' || d.type === 'lyft_driver_screenshot')
    const hasFront = draft.documents.some(d => d.type === 'license_front')
    const hasBack = draft.documents.some(d => d.type === 'license_back')
    if (!hasRideshare && !(hasFront && hasBack)) {
      return handleError('Upload a rideshare screenshot OR both sides of your driver license.')
    }
    if (!userId) return handleError('Session expired.')

    setLoading(true); setError('')

    // Upload any pending docs
    const uploadedDocs: Array<{ type: UploadedDoc['type']; path: string }> = []
    for (const doc of draft.documents) {
      if (doc.uploadedPath) { uploadedDocs.push({ type: doc.type, path: doc.uploadedPath }); continue }
      const ext = doc.file.type === 'application/pdf' ? 'pdf' : doc.file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${doc.type}.${ext}`
      const { error: upErr } = await supabase.storage.from('driver-documents').upload(path, doc.file, { upsert: true })
      if (upErr) return handleError(`Failed to upload ${doc.type}. Try again.`)
      uploadedDocs.push({ type: doc.type, path })
    }

    // Get city_id from driver_profiles
    const { data: dp } = await supabase.from('driver_profiles').select('city_id').eq('user_id', userId).single()
    if (!dp) return handleError('Profile not found. Please refresh.')

    // Create application
    const { data: appData, error: appErr } = await supabase
      .from('driver_applications')
      .insert({ user_id: userId, city_id: dp.city_id, status: 'in_review', submitted_at: new Date().toISOString() })
      .select('id')
      .single()
    if (appErr || !appData) return handleError('Failed to submit application. Try again.')
    const applicationId = (appData as unknown as { id: string }).id

    // Insert document records
    for (const doc of uploadedDocs) {
      const { data: signed } = await supabase.storage.from('driver-documents').createSignedUrl(doc.path, 60 * 60 * 24)
      await supabase.from('driver_documents').insert({
        application_id: applicationId,
        user_id: userId,
        document_type: doc.type,
        file_url: signed?.signedUrl ?? '',
        file_path: doc.path,
        uploaded_at: new Date().toISOString(),
      })
    }

    await supabase.from('driver_signup_progress').update({
      current_step: 7, is_complete: true, updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    setLoading(false)
    router.push('/verify/status')
  }

  // ── Document upload helper ───────────────────────────────────────────────────

  const addDocument = (type: UploadedDoc['type'], file: File) => {
    setDraft(d => ({
      ...d,
      documents: [
        ...d.documents.filter(doc => doc.type !== type),
        { type, file, uploadedPath: null },
      ],
    }))
  }

  const getDoc = (type: UploadedDoc['type']) => draft.documents.find(d => d.type === type)

  // ── Step content ─────────────────────────────────────────────────────────────

  const stepContent: Record<number, React.ReactNode> = {
    1: awaitingEmailConfirmation ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.6 }}>
            An email has been sent to <strong style={{ color: COLORS.text }}>{draft.email}</strong> to confirm your email. Please follow the link in the email to continue onboarding.
          </div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted }}>
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button onClick={() => setAwaitingEmailConfirmation(false)} style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            try again
          </button>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Create your account</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Start your driver journey</div>
        </div>
        <Field label="Full Name" required>
          <input style={inputStyle} type="text" placeholder="Your full name" value={draft.fullName} onChange={e => set('fullName', e.target.value)} />
        </Field>
        <Field label="Email" required>
          <input style={inputStyle} type="email" placeholder="you@email.com" value={draft.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" required>
          <input style={inputStyle} type="password" placeholder="Min. 8 characters" value={draft.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
        </Field>
        <PrimaryBtn onClick={handleStep1} loading={loading} disabled={!draft.email || !draft.password || !draft.fullName}>
          Continue →
        </PrimaryBtn>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontSize: 13, color: COLORS.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    ),

    2: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Your city</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Which city do you drive in?</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cities.map(c => (
            <button
              key={c.id}
              onClick={() => set('cityId', c.id)}
              style={{
                background: draft.cityId === c.id ? COLORS.accent + '18' : COLORS.card,
                border: `1px solid ${draft.cityId === c.id ? COLORS.accent + '60' : COLORS.border}`,
                borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 600,
                color: draft.cityId === c.id ? COLORS.accent : COLORS.text,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <PrimaryBtn onClick={handleStep2} loading={loading} disabled={!draft.cityId}>Continue →</PrimaryBtn>
        <GhostBtn onClick={() => setStep(1)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),

    3: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Your identity</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>How passengers will see you</div>
        </div>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]; if (!f) return
            set('avatarFile', f); set('avatarPreview', URL.createObjectURL(f)); e.target.value = ''
          }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: 84, height: 84, borderRadius: '50%', background: COLORS.card, border: `2px solid ${COLORS.accent}40`, overflow: 'hidden', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {draft.avatarPreview
              ? <Image src={draft.avatarPreview} alt="Avatar" width={84} height={84} style={{ objectFit: 'cover', width: '100%', height: '100%' }} unoptimized />
              : <span style={{ fontSize: 32 }}>👤</span>}
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: 12, color: COLORS.muted, cursor: 'pointer', fontFamily: 'inherit' }}>
            {draft.avatarPreview ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
        <Field label="Display Name" required>
          <input style={inputStyle} type="text" placeholder="e.g. Carlos V." value={draft.displayName} onChange={e => set('displayName', e.target.value)} />
        </Field>
        <Field label="Bio (max 300 chars)" required>
          <div style={{ position: 'relative' }}>
            <textarea
              value={draft.bio}
              onChange={e => set('bio', e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Tell passengers about yourself…"
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
            />
            <span style={{ position: 'absolute', right: 12, bottom: 10, fontSize: 11, color: draft.bio.length > 255 ? COLORS.accent : COLORS.muted }}>
              {draft.bio.length}/300
            </span>
          </div>
        </Field>
        <PrimaryBtn onClick={handleStep3} loading={loading} disabled={!draft.displayName || !draft.bio}>Continue →</PrimaryBtn>
        <GhostBtn onClick={() => setStep(2)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),

    4: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Vehicle & experience</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Optional — you can skip for now</div>
        </div>
        <Field label="Vehicle type">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VEHICLE_TYPES.map(v => (
              <button key={v.value} onClick={() => set('vehicleType', draft.vehicleType === v.value ? null : v.value)} style={{
                background: draft.vehicleType === v.value ? COLORS.accent + '18' : COLORS.card,
                border: `1px solid ${draft.vehicleType === v.value ? COLORS.accent + '60' : COLORS.border}`,
                borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                color: draft.vehicleType === v.value ? COLORS.accent : COLORS.text,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{v.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Years driving">
          <input style={inputStyle} type="number" placeholder="e.g. 3" value={draft.yearsDriving} onChange={e => set('yearsDriving', e.target.value)} min="0" max="50" />
        </Field>
        <Field label="Languages">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(lang => (
              <button key={lang} onClick={() => setDraft(d => ({ ...d, languages: d.languages.includes(lang) ? d.languages.filter(l => l !== lang) : [...d.languages, lang] }))} style={{
                background: draft.languages.includes(lang) ? COLORS.teal + '18' : COLORS.card,
                border: `1px solid ${draft.languages.includes(lang) ? COLORS.teal + '60' : COLORS.border}`,
                borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                color: draft.languages.includes(lang) ? COLORS.teal : COLORS.text,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{lang}</button>
            ))}
          </div>
        </Field>
        <PrimaryBtn onClick={() => handleStep4(false)} loading={loading}>Continue →</PrimaryBtn>
        <GhostBtn onClick={() => handleStep4(true)} disabled={loading}>Skip for now</GhostBtn>
        <GhostBtn onClick={() => setStep(3)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),

    5: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Your page setup</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Customize your passenger-facing page</div>
        </div>
        <Field label="Headline" required>
          <input style={inputStyle} type="text" placeholder="e.g. Tampa's friendliest driver 🌴" value={draft.headline} onChange={e => set('headline', e.target.value.slice(0, 80))} />
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, paddingLeft: 4 }}>{draft.headline.length}/80</div>
        </Field>
        <Field label="Hero image">
          <input ref={heroInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const f = e.target.files?.[0]; if (!f) return
            set('heroFile', f); set('heroPreview', URL.createObjectURL(f)); e.target.value = ''
          }} />
          <button onClick={() => heroInputRef.current?.click()} style={{ ...inputStyle, cursor: 'pointer', textAlign: 'left', color: draft.heroPreview ? COLORS.teal : COLORS.muted }}>
            {draft.heroPreview ? '✓ Image selected' : 'Upload hero image'}
          </button>
        </Field>
        <Field label="Your URL slug" required>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 14, pointerEvents: 'none' }}>
              roam/
            </span>
            <input
              style={{ ...inputStyle, paddingLeft: 54 }}
              type="text"
              placeholder="yourname"
              value={draft.publicUrlSlug}
              onChange={e => { set('publicUrlSlug', e.target.value); setSlugAvailable(null) }}
            />
            {slugAvailable !== null && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: slugAvailable ? COLORS.teal : COLORS.accent }}>
                {slugAvailable ? '✓ Available' : '✗ Taken'}
              </span>
            )}
          </div>
        </Field>
        <Field label="Service area">
          <input style={inputStyle} type="text" placeholder="e.g. Tampa Bay Area, TPA Airport" value={draft.serviceArea} onChange={e => set('serviceArea', e.target.value)} />
        </Field>
        <PrimaryBtn onClick={handleStep5} loading={loading} disabled={!draft.headline || !draft.publicUrlSlug || slugAvailable === false}>Continue →</PrimaryBtn>
        <GhostBtn onClick={() => setStep(4)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),

    6: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Tip links</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Optional — add payment handles so passengers can tip you</div>
        </div>
        <Field label="Cash App">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 14 }}>$</span>
            <input style={{ ...inputStyle, paddingLeft: 28 }} type="text" placeholder="YourHandle" value={draft.tipCashapp} onChange={e => set('tipCashapp', e.target.value)} />
          </div>
        </Field>
        <Field label="Venmo">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted, fontSize: 14 }}>@</span>
            <input style={{ ...inputStyle, paddingLeft: 28 }} type="text" placeholder="YourHandle" value={draft.tipVenmo} onChange={e => set('tipVenmo', e.target.value)} />
          </div>
        </Field>
        <Field label="PayPal">
          <input style={inputStyle} type="text" placeholder="YourHandle" value={draft.tipPaypal} onChange={e => set('tipPaypal', e.target.value)} />
        </Field>
        <PrimaryBtn onClick={() => handleStep6(false)} loading={loading}>Continue →</PrimaryBtn>
        <GhostBtn onClick={() => handleStep6(true)} disabled={loading}>Skip for now</GhostBtn>
        <GhostBtn onClick={() => setStep(5)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),

    7: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Verify your identity</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>Upload at least one proof to submit your application</div>
        </div>

        {/* Option A: Rideshare screenshot */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Option A — Rideshare Proof <span style={{ fontSize: 11, color: COLORS.teal, fontWeight: 600 }}>(Recommended)</span></div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>Screenshot of your active Uber or Lyft driver page showing your name & rating.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['uber_driver_screenshot', 'lyft_driver_screenshot'] as const).map(type => (
              <label key={type} style={{ flex: 1 }}>
                <div style={{
                  background: getDoc(type) ? COLORS.teal + '15' : COLORS.bg,
                  border: `1px solid ${getDoc(type) ? COLORS.teal + '50' : COLORS.border}`,
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'center',
                  fontSize: 12, color: getDoc(type) ? COLORS.teal : COLORS.muted, fontWeight: 600,
                }}>
                  {getDoc(type) ? '✓ ' : ''}
                  {type === 'uber_driver_screenshot' ? 'Uber' : 'Lyft'}
                </div>
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) addDocument(type, f); e.target.value = '' }} />
              </label>
            ))}
          </div>
        </div>

        {/* Option B: License */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Option B — Driver License</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>Both front and back are required.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['license_front', 'license_back'] as const).map(type => (
              <label key={type} style={{ flex: 1 }}>
                <div style={{
                  background: getDoc(type) ? COLORS.teal + '15' : COLORS.bg,
                  border: `1px solid ${getDoc(type) ? COLORS.teal + '50' : COLORS.border}`,
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'center',
                  fontSize: 12, color: getDoc(type) ? COLORS.teal : COLORS.muted, fontWeight: 600,
                }}>
                  {getDoc(type) ? '✓ ' : ''}
                  {type === 'license_front' ? 'Front' : 'Back'}
                </div>
                <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) addDocument(type, f); e.target.value = '' }} />
              </label>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 1.6 }}>
          Your documents are encrypted and reviewed only by the RoamCompanion team. They are never shared.
        </div>
        <PrimaryBtn onClick={handleStep7} loading={loading} disabled={draft.documents.length === 0}>Submit Application →</PrimaryBtn>
        <GhostBtn onClick={() => setStep(6)} disabled={loading}>← Back</GhostBtn>
      </div>
    ),
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <div style={{ padding: '24px 16px 48px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 24 }}>
          Roam<span style={{ color: COLORS.accent }}>Companion</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>Step {step} of {TOTAL_STEPS}</span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div style={{ height: 4, background: COLORS.card, borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: COLORS.accent, borderRadius: 100, width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Step content */}
        <div style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {stepContent[step]}
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: COLORS.accent, textAlign: 'center', marginTop: 12, animation: 'fadeUp 0.2s ease' }}>
            {error}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
