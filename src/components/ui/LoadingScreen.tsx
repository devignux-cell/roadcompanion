"use client"

import { useEffect, useState } from 'react'
import AmbientOrbs from '@/components/layout/AmbientOrbs'

const ICONS = ['✈️', '🚗', '🧳']
const CYCLE_MS = 6000

export default function LoadingScreen() {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    const loop = setInterval(() => {
      setAnimKey(k => k + 1)
    }, CYCLE_MS)
    return () => clearInterval(loop)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: "linear-gradient(to bottom, rgba(20, 20, 20, 0.7), rgba(5, 5, 12, .95))",
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AmbientOrbs />
      <div key={animKey} style={{ position: 'relative', zIndex: 1, width: 140, height: 140 }}>
        {ICONS.map((icon, i) => (
          <span
            key={icon}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
              lineHeight: 1,
              opacity: 0,
              filter:
                'grayscale(0.3) brightness(1.4) drop-shadow(0px 4px 12px rgba(255,255,255,0.08)) drop-shadow(0px -2px 6px rgba(0,0,0,0.6))',
              animation: [
                `iconEnter 0.4s ease ${i * 1.0}s forwards`,
                i < ICONS.length - 1
                  ? `iconExit 0.3s ease ${i * 1.0 + 0.8}s forwards`
                  : '',
              ]
                .filter(Boolean)
                .join(', '),
            }}
          >
            {icon}
          </span>
        ))}
      </div>
    </div>
  )
}
