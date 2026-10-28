// Runs the street outside the corner shop on one canvas: children walking and crossing, cars and
// birds, plus the timed flash and mask of each trial. During the flash a child walks out of the
// shop door holding up a snack, while paper planes fly past around the street. Timing is counted
// in animation frames, so a 120 ms flash shows for exactly the frames it should and the measured
// duration is reported back.

import {
  type FieldLevel,
  type SceneSize,
  CROSSING,
  HERO,
  HERO_LIFT,
  ISO_ZOOM,
  LANDSCAPE,
  LANES,
  POLES,
  SHOP,
  SLOT_COUNT,
  STREET,
  center,
  isoProject,
  sceneSizeFor,
  slotPosition,
} from './layout'
import {
  type FlyerKind,
  type KidFacing,
  type SnackKind,
  COLORS,
  INK,
  drawBackground,
  drawBird,
  drawCar,
  drawFixation,
  drawFlyer,
  drawKid,
  drawLeaf,
  drawPetal,
  drawPole,
  drawSlotMark,
  drawSnackCard,
} from './sprites'

export type StimulusSpec = {
  snack: SnackKind
  targetSlot: number
  distractors: { slot: number; kind: FlyerKind }[]
  level: FieldLevel
}

type Mode = 'idle' | 'stimulus' | 'mask' | 'question' | 'feedback'

// Positions are on the ground plane: `u` along the road, `v` across it.
type Car = { u: number; v: number; dir: 1 | -1; speed: number; color: string; bus: boolean }
type Kid = { u: number; v: number; du: number; dv: number; step: number; shirt: string; bag: string; crossing: boolean }
type Bird = { x: number; y: number; vx: number; vy: number; flap: number }
type MaskPiece = { kind: 'leaf' | 'petal'; x: number; y: number; size: number; rot: number; spin: number; color: string }

// The street gets a little busier and faster as the ring of paper planes widens.
const DENSITY: Record<FieldLevel, { carsPerLane: number; walkerGroups: number; crossers: number; birds: number; speed: number }> = {
  1: { carsPerLane: 1, walkerGroups: 2, crossers: 2, birds: 1, speed: 0.8 },
  2: { carsPerLane: 1, walkerGroups: 3, crossers: 3, birds: 2, speed: 1 },
  3: { carsPerLane: 2, walkerGroups: 4, crossers: 4, birds: 3, speed: 1.2 },
}

// Range of `u` the walkers and cars loop over, wide enough to cover both layouts.
const U_MIN = -800
const U_MAX = 600
// Children crossing walk out of the shop door and on down the street, or back the other way.
const CROSS_V_START = SHOP.v1 + 2
const CROSS_V_END = 320
const KID_SCALE = 1.25 * ISO_ZOOM
// The child with the snack walks straight down the screen, away from the door, in world units per second.
const HERO_SPEED = 8
// Paper planes cover at most this many pixels during a flash, passing their slot halfway through it.
const FLIGHT_SPAN = 90
// Radius of each gust of leaves in the mask, enough to cover a plane's whole flight.
const MASK_RADIUS = 58

// None of the moving things are red, so only the flyers can be mistaken for the target.
const SHIRTS = [COLORS.blue, COLORS.mint, COLORS.lilac, COLORS.orange, COLORS.pink, COLORS.white]
const BAGS = [COLORS.blue, COLORS.mint, COLORS.lilac, COLORS.orange]
const CAR_COLORS = [COLORS.mint, COLORS.lilac, COLORS.blue, COLORS.orange, COLORS.pink]
// Autumn leaves, including the target red, and blossom petals for the gust that masks the flash.
const LEAF_COLORS = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.tan, '#a6d78f', COLORS.mint]
const PETAL_COLORS = [COLORS.pink, COLORS.white, '#fbdbe5', COLORS.lilac]
// How far the gust carries each leaf across the screen, in pixels per millisecond.
const GUST_SPEED = 0.4

// Frames are drawn on vsync, so a phase ends on the first frame within half a frame of its target.
const HALF_FRAME_MS = 8

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

// Along the road (+u) is down-right on screen and across it (+v) is down-left, so walking toward
// +u or +v shows the child's front.
function kidFacing(kid: Kid): KidFacing {
  if (kid.crossing) return kid.dv > 0 ? 'front-left' : 'back-right'
  return kid.du > 0 ? 'front-right' : 'back-left'
}

function wrap(value: number, min: number, max: number) {
  const span = max - min
  if (value < min) return value + span
  if (value > max) return value - span
  return value
}

export class SchoolRunScene {
  size: SceneSize = LANDSCAPE
  // Called when the page is hidden mid-flash; that trial no longer counts.
  onInterrupt: (() => void) | null = null
  onResize: ((size: SceneSize) => void) | null = null

  private ctx: CanvasRenderingContext2D
  private background: HTMLCanvasElement | null = null
  private scale = 1
  private level: FieldLevel = 1
  private mode: Mode = 'idle'
  private stimulus: StimulusSpec | null = null
  private selectedSlot: number | null = null
  private run: {
    displayMs: number
    maskMs: number
    start: number | null
    maskStart: number | null
    shownMs: number
    onDone: (shownMs: number) => void
  } | null = null
  private mask: MaskPiece[] = []
  // Direction each slot's paper plane flies in this trial, mostly sideways.
  private headings: number[] = []
  private cars: Car[] = []
  private kids: Kid[] = []
  private birds: Bird[] = []
  private frame = 0
  private last = 0
  private motion: number

  constructor(
    private canvas: HTMLCanvasElement,
    private signLabel: string,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx
    // Motion is part of the challenge, so reduced motion slows the street rather than stopping it.
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.5 : 1
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.populate()
    this.frame = requestAnimationFrame(this.tick)
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    this.run = null
  }

  resize(cssWidth: number) {
    if (cssWidth <= 0) return
    const size = sceneSizeFor(cssWidth)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssHeight = (cssWidth * size.height) / size.width
    this.canvas.style.height = `${cssHeight}px`
    this.canvas.width = Math.round(cssWidth * dpr)
    this.canvas.height = Math.round(cssHeight * dpr)
    this.scale = this.canvas.width / size.width

    const layoutChanged = size !== this.size
    this.size = size
    const background = document.createElement('canvas')
    background.width = this.canvas.width
    background.height = this.canvas.height
    const bg = background.getContext('2d')
    if (bg) {
      bg.setTransform(this.scale, 0, 0, this.scale, 0, 0)
      drawBackground(bg, size, this.signLabel)
    }
    this.background = background
    if (layoutChanged) this.populate()
    this.onResize?.(size)
  }

  // Changing the level reshuffles the street, so call it between trials, not right before a flash.
  setLevel(level: FieldLevel) {
    if (level === this.level) return
    this.level = level
    this.populate()
  }

  showIdle() {
    this.mode = 'idle'
    this.run = null
    this.stimulus = null
  }

  // Shows the child with the snack and the paper planes for `displayMs`, masks for `maskMs`, then
  // calls `onDone` with the measured flash duration and leaves a question mark at the centre.
  runStimulus(spec: StimulusSpec, displayMs: number, maskMs: number, onDone: (shownMs: number) => void) {
    this.setLevel(spec.level)
    this.stimulus = spec
    this.selectedSlot = null
    this.mask = this.createMask(spec, maskMs)
    this.headings = Array.from(
      { length: SLOT_COUNT },
      () => (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.9,
    )
    this.run = { displayMs, maskMs, start: null, maskStart: null, shownMs: 0, onDone }
    this.mode = 'stimulus'
  }

  // Reveals the snack and the red plane's spot, and marks a wrong pick.
  showFeedback(spec: StimulusSpec, selectedSlot: number | null) {
    this.stimulus = spec
    this.selectedSlot = selectedSlot
    this.mode = 'feedback'
  }

  private handleVisibility = () => {
    if (document.hidden && (this.mode === 'stimulus' || this.mode === 'mask')) {
      this.showIdle()
      this.onInterrupt?.()
    }
  }

  private populate() {
    const d = DENSITY[this.level]

    this.cars = []
    LANES.forEach(([v, dir], lane) => {
      const speed = 50 + Math.random() * 30
      for (let i = 0; i < d.carsPerLane; i++) {
        this.cars.push({
          u: U_MIN + ((i + Math.random() * 0.5) / d.carsPerLane) * (U_MAX - U_MIN),
          v,
          dir,
          speed,
          color: pick(CAR_COLORS),
          bus: lane === 0 && i === 0 && Math.random() < 0.6,
        })
      }
    })

    this.kids = []
    const walkLines = [STREET.pavementNear, STREET.pavementFar].map(([v0, v1]) => (v0 + v1) / 2)
    for (let g = 0; g < d.walkerGroups; g++) {
      const v = walkLines[g % walkLines.length]
      const dir = Math.random() < 0.5 ? 1 : -1
      const du = (16 + Math.random() * 8) * dir
      const u0 = U_MIN + Math.random() * (U_MAX - U_MIN)
      const count = 2 + Math.floor(Math.random() * 2)
      for (let k = 0; k < count; k++) {
        this.kids.push({
          u: u0 - dir * k * 20,
          v: v + (k % 2 === 0 ? -6 : 6),
          du,
          dv: 0,
          step: Math.random() * 6,
          shirt: pick(SHIRTS),
          bag: pick(BAGS),
          crossing: false,
        })
      }
    }
    for (let c = 0; c < d.crossers; c++) {
      const outward = c % 2 === 0
      this.kids.push({
        u: outward ? CROSSING.u0 + 14 : CROSSING.u1 - 14,
        v: CROSS_V_START + Math.random() * (CROSS_V_END - CROSS_V_START),
        du: 0,
        dv: (18 + Math.random() * 8) * (outward ? 1 : -1),
        step: Math.random() * 6,
        shirt: pick(SHIRTS),
        bag: pick(BAGS),
        crossing: true,
      })
    }

    const { width: W, height: H } = this.size
    this.birds = Array.from({ length: d.birds }, () => ({
      x: Math.random() * W,
      y: H * (0.05 + Math.random() * 0.35),
      vx: (50 + Math.random() * 30) * (Math.random() < 0.5 ? 1 : -1),
      vy: (Math.random() - 0.5) * 16,
      flap: Math.random() * 6,
    }))

  }

  // A gust of leaves and petals over the snack and each plane spot, to wipe the afterimage. The
  // street stays visible, so it reads as a breeze through the scene rather than a flash.
  private createMask(spec: StimulusSpec, maskMs: number): MaskPiece[] {
    const spots = [
      center(this.size),
      ...Array.from({ length: SLOT_COUNT }, (_, slot) => slotPosition(slot, spec.level, this.size)),
    ]
    // Each gust starts a little upwind, so it is centred on its spot halfway through the mask.
    const upwind = (GUST_SPEED * maskMs) / 2
    return spots.flatMap((spot) =>
      Array.from({ length: 16 }, () => {
        // Covers the spot plus the stretch a paper plane flies through around it.
        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * MASK_RADIUS
        const leaf = Math.random() < 0.65
        return {
          kind: leaf ? ('leaf' as const) : ('petal' as const),
          x: spot.x + Math.cos(angle) * r - upwind,
          y: spot.y + Math.sin(angle) * r,
          size: (leaf ? 18 : 13) + Math.random() * 12,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.02,
          color: pick(leaf ? LEAF_COLORS : PETAL_COLORS),
        }
      }),
    )
  }

  private tick = (now: number) => {
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0
    this.last = now
    this.update(dt)
    this.advanceRun(now)
    this.draw(now)
    this.frame = requestAnimationFrame(this.tick)
  }

  private advanceRun(now: number) {
    const run = this.run
    if (!run) return
    if (this.mode === 'stimulus') {
      if (run.start === null) {
        run.start = now
      } else if (now - run.start >= run.displayMs - HALF_FRAME_MS) {
        run.shownMs = Math.round(now - run.start)
        run.maskStart = now
        this.mode = 'mask'
      }
    } else if (this.mode === 'mask' && run.maskStart !== null && now - run.maskStart >= run.maskMs - HALF_FRAME_MS) {
      this.mode = 'question'
      this.run = null
      run.onDone(run.shownMs)
    }
  }

  private update(dt: number) {
    const v = dt * DENSITY[this.level].speed * this.motion
    const { width: W, height: H } = this.size
    for (const car of this.cars) car.u = wrap(car.u + car.dir * car.speed * v, U_MIN, U_MAX)
    for (const kid of this.kids) {
      kid.u = wrap(kid.u + kid.du * v, U_MIN, U_MAX)
      if (kid.crossing) kid.v = wrap(kid.v + kid.dv * v, CROSS_V_START, CROSS_V_END)
      kid.step += v * 9
    }
    for (const bird of this.birds) {
      bird.x = wrap(bird.x + bird.vx * v, -30, W + 30)
      bird.y = wrap(bird.y + bird.vy * v, -30, H * 0.5)
      bird.flap += dt * 12
    }
  }

  // Everything standing on the ground, drawn back to front so nearer things overlap farther ones.
  private drawStreet() {
    const ctx = this.ctx
    const size = this.size
    const items: { depth: number; draw: () => void }[] = []

    for (const car of this.cars) {
      items.push({ depth: car.u + car.v + 30, draw: () => drawCar(ctx, size, car.u, car.v, car.color, car.bus, car.dir) })
    }
    for (const kid of this.kids) {
      items.push({
        depth: kid.u + kid.v,
        draw: () => {
          const p = isoProject(size, kid.u, kid.v)
          // Children leaving or entering the shop fade in and out at the door.
          ctx.globalAlpha = kid.crossing ? Math.min(1, Math.max(0, (kid.v - CROSS_V_START) / 14)) : 1
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.scale(KID_SCALE, KID_SCALE)
          drawKid(ctx, 0, -14, kid.step, kid.shirt, kid.bag, { facing: kidFacing(kid) })
          ctx.restore()
          ctx.globalAlpha = 1
        },
      })
    }
    for (const [u, v] of POLES) {
      items.push({ depth: u + v, draw: () => { const p = isoProject(size, u, v); drawPole(ctx, p.x, p.y) } })
    }

    items.sort((a, b) => a.depth - b.depth)
    for (const item of items) item.draw()
  }

  private draw(now: number) {
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (this.background) ctx.drawImage(this.background, 0, 0)
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0)

    this.drawStreet()
    for (const bird of this.birds) drawBird(ctx, bird.x, bird.y, bird.flap)
    if (this.mode === 'mask') {
      this.drawMask(this.run?.maskStart != null ? now - this.run.maskStart : 0)
      return
    }

    const c = center(this.size)
    const spec = this.stimulus
    const elapsed = this.run?.start != null ? now - this.run.start : 0

    if (spec && this.mode === 'stimulus') {
      const span = Math.min(FLIGHT_SPAN, (this.run?.displayMs ?? 0) * 0.05)
      const progress = this.run ? Math.min(1, elapsed / this.run.displayMs) - 0.5 : 0
      const size = spec.level === 3 ? 15 : 17
      const flyers = [...spec.distractors, { slot: spec.targetSlot, kind: 'red' as const }]
      for (const { slot, kind } of flyers) {
        const pos = slotPosition(slot, spec.level, this.size)
        const heading = this.headings[slot] ?? 0
        const x = pos.x + Math.cos(heading) * span * progress
        const y = pos.y + Math.sin(heading) * span * progress + Math.sin(elapsed / 120 + slot) * 2
        drawFlyer(ctx, kind, x, y, size, heading)
      }
      this.drawHero(spec.snack, (elapsed / 1000) * HERO_SPEED)
    }

    if (spec && this.mode === 'feedback') {
      this.drawHero(spec.snack, 0)
      const target = slotPosition(spec.targetSlot, spec.level, this.size)
      drawFlyer(ctx, 'red', target.x, target.y, 17, this.headings[spec.targetSlot] ?? 0)
      drawSlotMark(ctx, target.x, target.y, true)
      if (this.selectedSlot !== null && this.selectedSlot !== spec.targetSlot) {
        const picked = slotPosition(this.selectedSlot, spec.level, this.size)
        drawSlotMark(ctx, picked.x, picked.y, false)
      }
    }

    if (this.mode === 'question') drawSnackCard(ctx, c.x, c.y, 'question')
    // The dot marks where to look before the flash; during the flash the snack takes its place.
    if (this.mode === 'idle') drawFixation(ctx, c.x, c.y)
  }

  // The child stepping out of the shop door, `walked` world units along their path, holding the
  // snack up above their head. It starts on the fixation dot and drifts down a little as they walk.
  private drawHero(snack: SnackKind, walked: number) {
    const ctx = this.ctx
    const feet = isoProject(this.size, HERO.u + walked, HERO.v + walked)
    const card = { x: feet.x, y: feet.y - HERO_LIFT }
    ctx.save()
    ctx.translate(feet.x, feet.y)
    ctx.scale(KID_SCALE, KID_SCALE)
    drawKid(ctx, 0, -14, walked * 0.9, COLORS.orange, COLORS.blue, { raisedArm: true, face: true })
    ctx.restore()
    // The raised arm, from the shoulder up to the card.
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(feet.x + 8, feet.y - 30)
    ctx.lineTo(card.x + 6, card.y + 22)
    ctx.lineWidth = 7
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = 3.5
    ctx.strokeStyle = COLORS.skin
    ctx.stroke()
    drawSnackCard(ctx, card.x, card.y, snack)
  }

  // `elapsed` is the time since the mask appeared; the gust blows the leaves right and down a little.
  private drawMask(elapsed: number) {
    const ctx = this.ctx
    for (const piece of this.mask) {
      const x = piece.x + elapsed * GUST_SPEED
      const y = piece.y + elapsed * GUST_SPEED * 0.25 + Math.sin(piece.rot + elapsed * 0.02) * 3
      const rot = piece.rot + elapsed * piece.spin
      if (piece.kind === 'leaf') drawLeaf(ctx, x, y, piece.size, rot, piece.color)
      else drawPetal(ctx, x, y, piece.size, rot, piece.color)
    }
  }
}
