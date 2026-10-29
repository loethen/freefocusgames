// Canvas scene for Frog Memory Leap: the pond, its lily pads and one frog that hops between them.
// The React component owns the game rules; this class only animates what it is told.

import { type PadPosition, jumpDuration } from '../../hooks/useFrogEngine'
import { drawPad, drawPadShadow, drawPond, drawRipple } from './pond'
import { type FrogPose, drawFrog, drawFrogShadow, headingTo } from './frog'

/** Pad radius in pixels for a play area of the given size. */
export function padRadiusFor(w: number, h: number) {
  return Math.max(22, Math.min(64, w * 0.095, h * 0.12))
}

interface Pad {
  pos: PadPosition
  notch: number
  phase: number
  cueAt: number
  wrongAt: number
  landAt: number
}

interface Hop {
  from: number
  to: number
  start: number
  duration: number
  cue: boolean
  landed: boolean
  fromHeading: number
  toHeading: number
}

interface Ripple {
  x: number
  y: number
  r: number
  start: number
  life: number
  grow: number
  alpha: number
}

const CUE_MS = 900
const LAND_DIP_MS = 260

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)

export class FrogPondScene {
  private ctx: CanvasRenderingContext2D
  private bg: HTMLCanvasElement
  private w = 0
  private h = 0
  private dpr = 1
  private pads = new Map<number, Pad>()
  private frogPad: number | null = null
  private hintPad: number | null = null
  private heading = 0
  private hop: Hop | null = null
  private popAt = -Infinity
  private ripples: Ripple[] = []
  private nextAmbientRipple = 0
  private ambientHops = false
  private nextAmbientHop = 0
  private raf = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.bg = document.createElement('canvas')
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }

  resize(w: number, h: number) {
    if (w <= 0 || h <= 0) return
    this.w = w
    this.h = h
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    for (const c of [this.canvas, this.bg]) {
      c.width = Math.round(w * this.dpr)
      c.height = Math.round(h * this.dpr)
    }
    const bctx = this.bg.getContext('2d')!
    bctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    drawPond(bctx, w, h)
  }

  /** Replaces the pads on the pond and clears every mark. */
  setPads(pads: PadPosition[]) {
    this.pads.clear()
    for (const pos of pads) {
      this.pads.set(pos.id, {
        pos,
        notch: -Math.PI / 2 + ((pos.id * 2.3) % 1.6) - 0.8,
        phase: pos.id * 1.7,
        cueAt: -Infinity,
        wrongAt: -Infinity,
        landAt: -Infinity,
      })
    }
    this.hop = null
    this.hintPad = null
  }

  /** Puts the frog on a pad without a jump; `pop` makes it reappear with a small bounce. */
  placeFrog(padId: number, pop = false) {
    this.hop = null
    this.frogPad = padId
    if (pop) this.popAt = performance.now()
  }

  /** Hops to a pad over `duration` ms; with `cue`, the pad glows as the frog lands. */
  hopTo(padId: number, duration: number, cue = false) {
    const now = performance.now()
    // A hop still in flight is finished on the spot, so quick taps never fall behind.
    if (this.hop) {
      this.frogPad = this.hop.to
      this.heading = this.hop.toHeading
    }
    if (this.frogPad === null || this.frogPad === padId) {
      this.frogPad = padId
      return
    }
    const a = this.center(this.frogPad, now)
    const b = this.center(padId, now)
    const toHeading = headingTo(b.x - a.x, b.y - a.y)
    // Turn the short way round.
    const turn = Math.atan2(Math.sin(toHeading - this.heading), Math.cos(toHeading - this.heading))
    this.hop = { from: this.frogPad, to: padId, start: now, duration, cue, landed: false, fromHeading: this.heading, toHeading: this.heading + turn }
  }

  cue(padId: number) {
    const pad = this.pads.get(padId)
    if (pad) pad.cueAt = performance.now()
  }

  markWrong(padId: number) {
    const pad = this.pads.get(padId)
    if (pad) pad.wrongAt = performance.now()
  }

  /** Keeps a pad gently glowing until the pads change, to show where the frog should have gone. */
  showHint(padId: number) {
    this.hintPad = padId
  }

  /** On the start screen the frog hops about by itself. */
  setAmbientHops(on: boolean) {
    this.ambientHops = on
    this.nextAmbientHop = performance.now() + 1200
  }

  private radius() {
    return padRadiusFor(this.w, this.h)
  }

  private center(padId: number, now: number) {
    const pad = this.pads.get(padId)
    if (!pad) return { x: this.w / 2, y: this.h / 2 }
    const bob = Math.sin(now / 1500 + pad.phase) * 1.2
    const dip = now - pad.landAt < LAND_DIP_MS ? Math.sin(((now - pad.landAt) / LAND_DIP_MS) * Math.PI) * 3 : 0
    return { x: (pad.pos.px / 100) * this.w, y: (pad.pos.py / 100) * this.h + bob + dip }
  }

  private land(hop: Hop, now: number) {
    hop.landed = true
    const pad = this.pads.get(hop.to)
    if (!pad) return
    pad.landAt = now
    if (hop.cue) pad.cueAt = now
    const c = this.center(hop.to, now)
    const r = this.radius()
    this.ripples.push({ x: c.x, y: c.y + r * 0.05, r: r * 0.95, start: now, life: 700, grow: r * 0.55, alpha: 0.9 })
  }

  private updateAmbient(now: number) {
    if (now > this.nextAmbientRipple) {
      const r = this.radius()
      this.ripples.push({ x: Math.random() * this.w, y: Math.random() * this.h, r: r * 0.2, start: now, life: 2600, grow: r * 0.7, alpha: 0.45 })
      this.nextAmbientRipple = now + 1800 + Math.random() * 1600
    }
    if (this.ambientHops && !this.hop && this.frogPad !== null && now > this.nextAmbientHop && this.pads.size > 1) {
      const others = [...this.pads.keys()].filter(id => id !== this.frogPad)
      const to = others[Math.floor(Math.random() * others.length)]
      this.hopTo(to, jumpDuration(this.pads.get(this.frogPad)!.pos, this.pads.get(to)!.pos))
      this.nextAmbientHop = now + 2600 + Math.random() * 1800
    }
  }

  // Works out where the frog is and how it is posed: crouch and turn, flight arc, then landing squash.
  // The legs blend continuously between folded and kicked out, so the motion stays smooth.
  private frogState(now: number) {
    const r = this.radius()
    const pose: FrogPose = {
      heading: this.heading,
      squash: 1 + Math.sin(now / 280) * 0.012,
      legs: 0,
      arms: 0,
    }
    let scale = 1
    const pop = (now - this.popAt) / 280
    if (pop < 1) scale = 0.5 + 0.5 * easeOutBack(clamp01(pop))

    const hop = this.hop
    if (!hop) {
      const c = this.frogPad === null ? { x: this.w / 2, y: this.h / 2 } : this.center(this.frogPad, now)
      return { x: c.x, ground: c.y, lift: 0, pose, scale }
    }

    const a = this.center(hop.from, now)
    const b = this.center(hop.to, now)
    const crouch = Math.min(hop.duration * 0.22, 180)
    const landing = Math.min(hop.duration * 0.22, 170)
    const air = hop.duration - crouch - landing
    const t = now - hop.start

    if (t < crouch) {
      const k = easeOut(t / crouch)
      pose.squash = 1 - 0.16 * k
      pose.heading = lerp(hop.fromHeading, hop.toHeading, k)
      return { x: a.x, ground: a.y, lift: 0, pose, scale }
    }

    if (t < crouch + air) {
      const k = (t - crouch) / air
      const along = k * 0.75 + k * k * (3 - 2 * k) * 0.25
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const height = Math.min(dist * 0.32 + r * 0.35, r * 2.4)
      // Legs snap out on take-off, stay stretched, then gather in before touchdown.
      pose.legs = k < 0.18 ? easeOut(k / 0.18) : k < 0.6 ? 1 : lerp(1, 0.3, easeOut((k - 0.6) / 0.4))
      pose.arms = clamp01((k - 0.1) / 0.5)
      pose.squash = k < 0.5 ? lerp(1.12, 1, k / 0.5) : lerp(1, 1.03, (k - 0.5) / 0.5)
      pose.heading = hop.toHeading
      return {
        x: lerp(a.x, b.x, along),
        ground: lerp(a.y, b.y, along),
        lift: 4 * height * k * (1 - k),
        pose,
        // Seen from above, height reads as the frog growing towards the viewer.
        scale: scale * (1 + 0.2 * Math.sin(Math.PI * k)),
      }
    }

    if (!hop.landed) this.land(hop, now)
    const k = clamp01((t - crouch - air) / landing)
    pose.squash = k < 0.35 ? lerp(1.03, 0.84, k / 0.35) : lerp(0.84, 1, easeOutBack((k - 0.35) / 0.65))
    pose.legs = lerp(0.3, 0, easeOut(clamp01(k / 0.6)))
    pose.arms = lerp(1, 0, clamp01(k / 0.5))
    pose.heading = hop.toHeading
    if (k >= 1) {
      this.frogPad = hop.to
      this.heading = hop.toHeading
      this.hop = null
    }
    return { x: b.x, ground: b.y, lift: 0, pose, scale }
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame)
    if (!this.w) return
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(this.bg, 0, 0)
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.updateAmbient(now)
    const frog = this.frogState(now)
    const r = this.radius()

    // Ripples sit on the water, under the pads.
    this.ripples = this.ripples.filter(rp => now - rp.start < rp.life)
    for (const rp of this.ripples) {
      const k = (now - rp.start) / rp.life
      drawRipple(ctx, rp.x, rp.y, rp.r + rp.grow * easeOut(k), rp.alpha * (1 - k))
    }

    for (const [id, pad] of this.pads) {
      const c = this.center(id, now)
      const wrongK = now - pad.wrongAt
      const shake = wrongK < 420 ? Math.sin(wrongK / 28) * 4 * (1 - wrongK / 420) : 0
      drawPadShadow(ctx, c.x + shake, c.y, r)
      drawPad(ctx, c.x + shake, c.y, r, {
        notch: pad.notch,
        cue: id === this.hintPad ? 0.65 + 0.35 * Math.sin(now / 220) : clamp01(1 - (now - pad.cueAt) / CUE_MS),
        wrong: Number.isFinite(pad.wrongAt) ? clamp01(wrongK / 150) : 0,
      })
    }

    const size = r * 1.05 * frog.scale
    drawFrogShadow(ctx, frog.x, frog.ground, size, frog.lift)
    drawFrog(ctx, frog.x, frog.ground - frog.lift, size, frog.pose)
  }
}
