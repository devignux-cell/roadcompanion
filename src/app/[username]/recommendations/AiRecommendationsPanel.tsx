"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/constants/colors'

interface AiItem {
  order: number; type: string; title: string; description: string
  start_time: string | null; duration_label: string | null
  map_link: string | null; booking_link: string | null
}

interface AiResult {
  title: string; city: string; items: AiItem[]
}

const ITEM_EMOJI: Record<string, string> = {
  food: '🍽️', activity: '🎭', place: '📍', transport: '🚌',
}

export default function AiRecommendationsPanel({ driverProfileId }: { driverProfileId: string }) {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<AiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'premium_required' | 'auth_required' | 'generic' | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true); setError(null); setResult(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); setError('auth_required'); return }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) { setLoading(false); setError('generic'); return }

    const res = await fetch(`${supabaseUrl}/functions/v1/generate-experience`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ driver_profile_id: driverProfileId, prompt: prompt.trim() }),
    })

    setLoading(false)

    if (res.status === 403) { setError('premium_required'); return }
    if (!res.ok) { setError('generic'); return }

    const data = await res.json()
    try {
      setResult(data.response_json as AiResult)
    } catch {
      setError('generic')
    }
  }

  return (
    <div style={{ margin: '0 16px 24px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.card}, rgba(162,89,255,0.08))`,
        border: `1px solid ${COLORS.purple}30`,
        borderRadius: 20, padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: COLORS.purple + '20', border: `1px solid ${COLORS.purple}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>✨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>AI Recommendations</div>
            <div style={{ fontSize: 11, color: COLORS.muted }}>Personalized itinerary · Premium</div>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Romantic dinner then live music, under $100…"
          rows={2}
          style={{
            width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: '10px 12px', fontSize: 14, color: COLORS.text,
            outline: 'none', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            marginTop: 10, width: '100%',
            background: loading || !prompt.trim() ? COLORS.card : COLORS.purple,
            border: `1px solid ${COLORS.purple}40`, borderRadius: 12,
            padding: '12px', fontSize: 14, fontWeight: 700,
            color: loading || !prompt.trim() ? COLORS.muted : '#fff',
            cursor: loading || !prompt.trim() ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          {loading ? 'Generating…' : '✨ Generate Itinerary'}
        </button>

        {/* Error states */}
        {error === 'premium_required' && (
          <div style={{ marginTop: 12, fontSize: 13, color: COLORS.gold, textAlign: 'center', lineHeight: 1.6 }}>
            ⭐ AI recommendations require a premium subscription.
          </div>
        )}
        {error === 'auth_required' && (
          <div style={{ marginTop: 12, fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>
            Sign in to use AI recommendations.
          </div>
        )}
        {error === 'generic' && (
          <div style={{ marginTop: 12, fontSize: 13, color: COLORS.accent, textAlign: 'center' }}>
            Something went wrong. Try again.
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 12, background: COLORS.card, border: `1px solid ${COLORS.purple}30`,
          borderRadius: 20, padding: '20px',
          animation: 'fadeUp 0.4s ease',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
            {result.title}
          </div>
          <div style={{ fontSize: 12, color: COLORS.purple, marginBottom: 16 }}>
            📍 {result.city}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.items.map((item, i) => (
              <div key={i} style={{
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>
                    {ITEM_EMOJI[item.type] ?? '📍'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{item.title}</div>
                    {item.start_time && (
                      <div style={{ fontSize: 11, color: COLORS.teal, marginTop: 2 }}>{item.start_time}{item.duration_label ? ` · ${item.duration_label}` : ''}</div>
                    )}
                    <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4, lineHeight: 1.6 }}>{item.description}</div>
                    {(item.map_link || item.booking_link) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {item.map_link && (
                          <a href={item.map_link} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 11, fontWeight: 600, color: COLORS.teal,
                            background: COLORS.teal + '12', border: `1px solid ${COLORS.teal}30`,
                            borderRadius: 8, padding: '4px 10px', textDecoration: 'none',
                          }}>Map →</a>
                        )}
                        {item.booking_link && (
                          <a href={item.booking_link} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 11, fontWeight: 600, color: COLORS.gold,
                            background: COLORS.gold + '12', border: `1px solid ${COLORS.gold}30`,
                            borderRadius: 8, padding: '4px 10px', textDecoration: 'none',
                          }}>Book →</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
