// Memphis-style pond in a fresh, light palette: pale water, soft slate outlines and pale offset shadows.
// The lily pads and the pond are drawn with paths; the frog is drawn in frog.ts.

export const INK = '#3c4656'
const SHADOW = 'rgba(60, 70, 86, 0.16)'
export const COLORS = {
  waterTop: '#e4f5f3',
  waterBottom: '#c9e8ec',
  pad: '#a6d78f',
  padEdge: '#86c07a',
  cue: '#fbe3a1',
  wrong: '#f6b0a0',
  reed: '#bfe0ab',
  cattail: '#d9b48a',
  stone: '#ebe4d4',
  lilac: '#cfc3ec',
  pink: '#f7c6d4',
  yellow: '#fbe3a1',
  blue: '#a9d2ef',
  white: '#ffffff',
}

// Round things lying flat on the water are seen from above at an angle, so they are squashed vertically.
export const PAD_TILT = 0.72

// Small deterministic generator so the static background looks the same on every redraw.
export function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Blends two hex colours; t = 0 gives a, t = 1 gives b.
export function mix(a: string, b: string, t: number) {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => Math.round(((na >> shift) & 255) * (1 - t) + ((nb >> shift) & 255) * t)
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

function inked(ctx: CanvasRenderingContext2D, fill: string, lineWidth = 2.5) {
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke()
}

// ── Static background ──

function drawReeds(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flip: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip, 1)
  const blades = [
    { dx: -0.2, h: 1.0, lean: -0.35 },
    { dx: 0.05, h: 1.35, lean: 0.1 },
    { dx: 0.3, h: 0.85, lean: 0.4 },
  ]
  // Cattail stem behind the blades.
  ctx.beginPath()
  ctx.moveTo(0.12 * s, 0)
  ctx.quadraticCurveTo(0.16 * s, -0.8 * s, 0.24 * s, -1.5 * s)
  ctx.lineWidth = 2
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(0.23 * s, -1.38 * s, 0.07 * s, 0.2 * s, 0.1, 0, Math.PI * 2)
  inked(ctx, COLORS.cattail, 2)
  for (const b of blades) {
    const bx = b.dx * s
    const tipX = bx + b.lean * s
    const tipY = -b.h * s
    ctx.beginPath()
    ctx.moveTo(bx - 0.07 * s, 0)
    ctx.quadraticCurveTo(bx - 0.06 * s + b.lean * s * 0.3, tipY * 0.55, tipX, tipY)
    ctx.quadraticCurveTo(bx + 0.08 * s + b.lean * s * 0.3, tipY * 0.5, bx + 0.08 * s, 0)
    ctx.closePath()
    inked(ctx, COLORS.reed, 2)
  }
  ctx.restore()
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath()
  ctx.ellipse(x + 3, y + 4, r, r * 0.62, 0, 0, Math.PI * 2)
  ctx.fillStyle = SHADOW
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2)
  inked(ctx, color, 2)
  ctx.beginPath()
  ctx.ellipse(x - r * 0.35, y - r * 0.2, r * 0.25, r * 0.12, -0.3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fill()
}

function drawBlossom(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.save()
    ctx.scale(1, PAD_TILT)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(s * 0.5, 0, s * 0.5, s * 0.22, 0, 0, Math.PI * 2)
    ctx.restore()
    inked(ctx, COLORS.pink, 1.8)
  }
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.24, s * 0.24 * PAD_TILT, 0, 0, Math.PI * 2)
  inked(ctx, COLORS.yellow, 1.8)
  ctx.restore()
}

// Draws the water and the shore details into the cached background layer.
export function drawPond(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, COLORS.waterTop)
  g.addColorStop(1, COLORS.waterBottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const rand = seeded(7)
  const unit = Math.min(w, h)

  // Soft light streaks on the water surface.
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 2
  for (let i = 0; i < 16; i++) {
    const x = rand() * w
    const y = rand() * h
    const len = unit * (0.04 + rand() * 0.05)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + len * 0.25, y - 3, x + len * 0.5, y)
    ctx.quadraticCurveTo(x + len * 0.75, y + 3, x + len, y)
    ctx.stroke()
  }

  // A sprinkle of pastel Memphis dots and rings, kept faint so they never compete with the pads.
  const confetti = [COLORS.lilac, COLORS.yellow, COLORS.pink, COLORS.blue]
  for (let i = 0; i < 10; i++) {
    const x = rand() * w
    const y = rand() * h
    const r = unit * (0.006 + rand() * 0.008)
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * PAD_TILT, 0, 0, Math.PI * 2)
    if (i % 2 === 0) {
      ctx.fillStyle = confetti[i % confetti.length]
      ctx.fill()
    } else {
      ctx.lineWidth = 2
      ctx.strokeStyle = confetti[i % confetti.length]
      ctx.stroke()
    }
  }

  // Shore details live in the corners, away from every pad position.
  const s = unit * 0.11
  drawStone(ctx, -s * 0.1, h * 0.58, s * 0.55, COLORS.stone)
  drawStone(ctx, s * 0.3, h * 0.64, s * 0.32, COLORS.lilac)
  drawStone(ctx, w + s * 0.05, h * 0.3, s * 0.5, COLORS.stone)
  drawReeds(ctx, s * 0.35, h + s * 0.1, s, 1)
  drawReeds(ctx, w - s * 0.3, h + s * 0.1, s * 0.8, -1)
  drawBlossom(ctx, w - s * 0.55, h * 0.06, s * 0.28)
  drawBlossom(ctx, s * 0.45, h * 0.05, s * 0.22)
}

// ── Lily pads ──

export interface PadLook {
  /** Notch direction in radians. */
  notch: number
  /** 0–1 glow showing where the frog went during the demo. */
  cue: number
  /** 0–1 coral tint for a wrong tap. */
  wrong: number
}

function padPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, notch: number) {
  const gap = 0.32
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * PAD_TILT, 0, notch + gap, notch - gap + Math.PI * 2)
  ctx.lineTo(x, y)
  ctx.closePath()
}

export function drawPadShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.ellipse(x + r * 0.08, y + r * 0.16, r, r * PAD_TILT, 0, 0, Math.PI * 2)
  ctx.fillStyle = SHADOW
  ctx.fill()
}

export function drawPad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, look: PadLook) {
  const ry = r * PAD_TILT
  if (look.cue > 0) {
    ctx.beginPath()
    ctx.ellipse(x, y, r * 1.22, ry * 1.22, 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(251, 227, 161, ${0.75 * look.cue})`
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = `rgba(232, 184, 74, ${look.cue})`
    ctx.stroke()
  }

  const top = look.wrong > 0 ? mix(COLORS.pad, COLORS.wrong, look.wrong) : COLORS.pad
  const edge = look.wrong > 0 ? mix(COLORS.padEdge, '#e48f7e', look.wrong) : COLORS.padEdge
  const lw = Math.max(1.8, r * 0.045)

  // A thin darker rim underneath gives the floating pad some thickness.
  padPath(ctx, x, y + r * 0.07, r, look.notch)
  inked(ctx, edge, lw)
  padPath(ctx, x, y, r, look.notch)
  inked(ctx, top, lw)

  // Veins fan out from the centre, skipping the notch.
  ctx.save()
  padPath(ctx, x, y, r, look.notch)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = Math.max(1.2, r * 0.03)
  ctx.lineCap = 'round'
  for (let i = 1; i < 7; i++) {
    const a = look.notch + (i / 7) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * ry * 0.78)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.ellipse(x - r * 0.38, y - ry * 0.38, r * 0.2, ry * 0.12, -0.35, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fill()
  ctx.restore()
}

// Expanding ring on the water, used for landings and the slow ambient ripples.
export function drawRipple(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * PAD_TILT, 0, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
  ctx.stroke()
}
