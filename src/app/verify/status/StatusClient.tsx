"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'
import { createClient } from '@/lib/supabase/client'
import type { DriverApplication, DriverDocument } from '@/lib/supabase/types'

const inputStyle = {
  width: '100%',
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  color: COLORS.text,
  fontFamily: 'inherit',
} as const

type AppStatus = DriverApplication['status']
type DocRow = Pick<DriverDocument, 'document_type' | 'uploaded_at' | 'status'>
type AppRow = Pick<DriverApplication, 'status' | 'submitted_at' | 'reviewed_at' | 'review_notes'>

const STATUS_CONFIG: Record<AppStatus, { icon: string; color: string; label: string; message: string }> = {
  pending_submission: {
    icon: '●', color: '#F5C842',
    label: 'Pending Submission',
    message: 'Your application has not been submitted yet. Please complete the signup process.',
  },
  in_review: {
    icon: '●', color: '#3B82F6',
    label: 'In Review',
    message: 'Your application is being reviewed by the RoamCompanion team. This usually takes 1–2 business days.',
  },
  approved: {
    icon: '✓', color: COLORS.teal,
    label: 'Approved',
    message: 'Welcome to RoamCompanion! Your profile is ready.',
  },
  rejected: {
    icon: '✕', color: COLORS.accent,
    label: 'Not Approved',
    message: 'Your application was not approved at this time.',
  },
}

const DOC_LABELS: Record<string, string> = {
  license_front: 'License Front',
  license_back: 'License Back',
  uber_driver_screenshot: 'Uber Screenshot',
  lyft_driver_screenshot: 'Lyft Screenshot',
  insurance: 'Insurance',
}

export default function StatusClient({
  application: initialApp,
  documents,
  userId,
}: {
  application: AppRow
  documents: DocRow[]
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [application, setApplication] = useState<AppRow>(initialApp)

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [contactError, setContactError] = useState('')

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactStatus('sending')
    setContactError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim() || undefined,
          email: contactEmail.trim(),
          message: contactMessage.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to send')
      }
      setContactStatus('sent')
      setContactName('')
      setContactEmail('')
      setContactMessage('')
    } catch (err) {
      setContactStatus('error')
      setContactError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  // Poll every 30s while in_review
  useEffect(() => {
    if (application.status !== 'in_review') return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('driver_applications')
        .select('status, submitted_at, reviewed_at, review_notes')
        .eq('user_id', userId)
        .single()
      if (data && data.status !== 'in_review') {
        setApplication(data)
        clearInterval(interval)
        if (data.status === 'approved') router.push('/dashboard')
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [application.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const config = STATUS_CONFIG[application.status]

  return (
    <PageWrapper>
      <div style={{ padding: '40px 24px 48px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 40 }}>
          Roam<span style={{ color: COLORS.accent }}>Companion</span>
        </div>

        {/* Status card */}
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 24, padding: '32px 24px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 28, color: config.color, fontWeight: 700, lineHeight: 1 }}>{config.icon}</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>
                Verification Status
              </div>
              <div style={{ fontSize: 13, color: config.color, fontWeight: 700, marginTop: 2 }}>
                {config.label}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.7, marginBottom: 20 }}>
            {config.message}
          </div>

          {/* Documents */}
          {documents.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                Documents Submitted
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: COLORS.teal, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 13, color: COLORS.text }}>
                      {DOC_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {application.submitted_at && (
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 16 }}>
              Submitted: {new Date(application.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Rejection notes */}
        {application.status === 'rejected' && application.review_notes && (
          <div style={{
            background: COLORS.accent + '10', border: `1px solid ${COLORS.accent}30`,
            borderRadius: 16, padding: '20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Reason
            </div>
            <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.6, marginBottom: 12 }}>
              {application.review_notes}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>
              If you believe this is an error, contact{' '}
              <a href="mailto:support@roamcompanion.app" style={{ color: COLORS.accent }}>support@roamcompanion.app</a>
            </div>
          </div>
        )}

        {/* Approved — dashboard CTA */}
        {application.status === 'approved' && (
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: COLORS.accent, border: 'none', borderRadius: 16,
              padding: '16px', fontSize: 15, fontWeight: 700, color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Go to Dashboard →
          </button>
        )}

        {/* In review — pulse indicator */}
        {application.status === 'in_review' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: COLORS.muted }}>Checking for updates…</span>
          </div>
        )}

        {/* Contact */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 40,
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Contact
          </div>
          <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6, marginBottom: 20 }}>
            Questions? Reach out at{' '}
            <a href="mailto:devignux@gmail.com" style={{ color: COLORS.accent, textDecoration: 'none' }}>
              devignux@gmail.com
            </a>
            {' '}or send a message below.
          </p>
          <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Name (optional)"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              style={inputStyle}
              disabled={contactStatus === 'sending'}
            />
            <input
              type="email"
              placeholder="Email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              style={inputStyle}
              required
              disabled={contactStatus === 'sending'}
            />
            <textarea
              placeholder="Message"
              value={contactMessage}
              onChange={e => setContactMessage(e.target.value)}
              required
              minLength={10}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              disabled={contactStatus === 'sending'}
            />
            <button
              type="submit"
              disabled={contactStatus === 'sending' || !contactEmail.trim() || contactMessage.trim().length < 10}
              style={{
                background: COLORS.accent,
                border: 'none',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: contactStatus === 'sending' ? 'default' : 'pointer',
                opacity: contactStatus === 'sending' ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {contactStatus === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            {contactStatus === 'sent' && (
              <span style={{ fontSize: 13, color: COLORS.teal }}>Message sent. We&apos;ll reply soon.</span>
            )}
            {contactStatus === 'error' && contactError && (
              <span style={{ fontSize: 13, color: COLORS.accent }}>{contactError}</span>
            )}
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
