"use client"

import { useEffect, useState } from 'react'
import AmbientOrbs from '@/components/layout/AmbientOrbs'

/** Car SVG build animation ~4.3s; loop shortly after */
const CYCLE_MS = 4500

export default function LoadingScreen() {
  const [mountId] = useState(() => Date.now())
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
        background: "linear-gradient(to bottom, rgba(200, 200, 200, 1), rgba(5, 5, 12, 1))",
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AmbientOrbs />
      <div key={animKey} style={{ position: 'relative', zIndex: 1, width: 260, height: 182 }}>
        <img
          src={`/images/roam_car_build.svg?v=${mountId}-${animKey}`}
          alt="Roam Companion"
          width={260}
          height={182}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}
