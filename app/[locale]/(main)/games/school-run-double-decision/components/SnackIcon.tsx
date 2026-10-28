'use client'

import { useEffect, useRef } from 'react'
import { type SnackKind, drawSnack } from './scene/sprites'

// The answer buttons draw the snacks with the same code as the kiosk, so they match exactly.
export function SnackIcon({ kind, size = 64 }: { kind: SnackKind; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    drawSnack(ctx, kind, size / 2, size / 2, size * 0.8)
  }, [kind, size])

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />
}
