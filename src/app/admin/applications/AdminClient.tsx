"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import { COLORS } from '@/lib/constants/colors'

type DocWithUrl = { id: string; document_type: string; uploaded_at: string; signedUrl: string }
type Application = {
  id: string; userId: string; submitted_at: string | null; review_notes: string | null
  driverName: string; driverEmail: string; cityName: string
  documents: DocWithUrl[]
}

const DOC_LABELS: Record<string, string> = {
  license_front: 'License Front', license_back: 'License Back',
  uber_driver_screenshot: 'Uber Screenshot', lyft_driver_screenshot: 'Lyft Screenshot', insurance: 'Insurance',
}

export default function AdminClient({ applications, adminId }: { applications: Application[]; adminId: string }) {
  const router = useRouter()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<string[]>([])

  const handleAction = async (appId: string, driverUserId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !notes[appId]?.trim()) {
      setError('Please provide review notes before rejecting.')
      return
    }
    setProcessing(appId); setError('')

    const res = await fetch('/api/admin/approve-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: appId, driverUserId, action, reviewNotes: notes[appId] ?? '' }),
    })

    if (!res.ok) {
      setError('Action failed. Please try again.')
    } else {
      setDone(d => [...d, appId])
    }
    setProcessing(null)
  }

  const visible = applications.filter(a => !done.includes(a.id))

  const btnStyle = (variant: 'approve' | 'reject' | 'ghost'): React.CSSProperties => ({
    background: variant === 'approve' ? COLORS.teal + '15' : variant === 'reject' ? COLORS.accent + '15' : 'none',
    border: `1px solid ${variant === 'approve' ? COLORS.teal + '50' : variant === 'reject' ? COLORS.accent + '50' : COLORS.border}`,
    borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700,
    color: variant === 'approve' ? COLORS.teal : variant === 'reject' ? COLORS.accent : COLORS.muted,
    cursor: 'pointer', fontFamily: 'inherit',
  })

  return (
    <PageWrapper>
      <div style={{ padding: '32px 16px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }}>Applications</div>
            <div style={{ fontSize: 13, color: COLORS.muted }}>In Review · {visible.length} pending</div>
          </div>
          <button onClick={() => router.push('/dashboard')} style={btnStyle('ghost')}>Dashboard</button>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: COLORS.accent, marginBottom: 16, padding: '10px 14px', background: COLORS.accent + '10', borderRadius: 10 }}>
            {error}
          </div>
        )}

        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted, fontSize: 14 }}>
            No pending applications. All caught up! 🎉
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {visible.map(app => (
            <div
              key={app.id}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '20px' }}
            >
              {/* Driver info */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{app.driverName || '—'}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                  {app.driverEmail || '—'} · {app.cityName || '—'}
                  {app.submitted_at && ` · Submitted ${new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </div>
              </div>

              {/* Documents */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Documents</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {app.documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13 }}>📄 {DOC_LABELS[doc.document_type] ?? doc.document_type}</span>
                      {doc.signedUrl && (
                        <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: COLORS.accent, textDecoration: 'none', fontWeight: 600 }}>
                          View ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Review notes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Review Notes</div>
                <textarea
                  value={notes[app.id] ?? ''}
                  onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                  placeholder="Required for rejection. Optional for approval."
                  rows={2}
                  style={{
                    background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10,
                    padding: '10px 12px', fontSize: 13, color: COLORS.text, outline: 'none',
                    width: '100%', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleAction(app.id, app.userId, 'approve')}
                  disabled={processing === app.id}
                  style={{ ...btnStyle('approve'), flex: 1, opacity: processing === app.id ? 0.5 : 1 }}
                >
                  {processing === app.id ? 'Processing…' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleAction(app.id, app.userId, 'reject')}
                  disabled={processing === app.id}
                  style={{ ...btnStyle('reject'), flex: 1, opacity: processing === app.id ? 0.5 : 1 }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
