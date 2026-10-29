// The frog, drawn in code after the original sprite sheet: a top-down golden frog with orange legs, black eyes
// on the sides of the head, dark red toe pads and a white sticker outline. Because the legs are rigged rather than
// swapped frame by frame, a hop blends smoothly from sitting to stretched and back.

const BODY = '#feb109'
const LIMB = '#ee8a14'
const TOE = '#a8121c'
const EYE = '#1f1d1c'
const STICKER = '#ffffff'
// A faint line outside the white sticker edge so it still reads on the pale water.
const STICKER_EDGE = 'rgba(60, 70, 86, 0.28)'

export interface FrogPose {
  /** Direction the head points, in radians clockwise from "up the screen". */
  heading: number
  /** Squash along the body: below 1 crouches, above 1 stretches. Width compensates. */
  squash: number
  /** 0 = hind legs folded around the body, 1 = kicked out behind it. */
  legs: number
  /** 0 = front legs planted, 1 = reaching ahead for the landing. */
  arms: number
}

type P = [number, number]

interface LimbPose {
  /** Joints from the body outward; the toe pads sit around the last one. */
  joints: P[]
  /** Directions of the toes in radians (local frame, right side). */
  toes: number[]
  /** Thickness at each joint; segments taper between them, so a folded thigh bulks up and a kicked leg slims down. */
  widths: number[]
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpP = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const lerpLimb = (a: LimbPose, b: LimbPose, t: number): LimbPose => ({
  joints: a.joints.map((p, i) => lerpP(p, b.joints[i], t)),
  toes: a.toes.map((v, i) => lerp(v, b.toes[i], t)),
  widths: a.widths.map((v, i) => lerp(v, b.widths[i], t)),
})

// Right-hand limbs in frog units: the frog's centre is (0, 0) and its head points to -y. The left side is mirrored.
// Sitting follows a real frog's folded hind leg, as in the sprite: the thick thigh runs out from the hip so the knee
// sits beside the body, the shin folds back so the heel sits behind the rump, and the foot runs forward again along
// the outside with its toes spread beside the belly. Folded tightly, the three read as one solid haunch.
// In the air the legs kick back.
const LEG_FOLDED: LimbPose = {
  joints: [[0.06, 0.27], [0.36, 0.15], [0.27, 0.43], [0.46, 0.19]],
  toes: [-0.8, -0.25, 0.3],
  widths: [0.24, 0.2, 0.15, 0.09],
}
const LEG_KICKED: LimbPose = {
  joints: [[0.08, 0.26], [0.28, 0.48], [0.2, 0.74], [0.22, 0.88]],
  toes: [1.15, 1.57, 2.0],
  widths: [0.13, 0.09, 0.075, 0.065],
}
// Short front legs with the elbow bent back and the hand turned out beside the head.
const ARM_PLANTED: LimbPose = { joints: [[0.12, -0.14], [0.25, -0.06], [0.3, -0.18]], toes: [-1.1, -0.5, 0.1], widths: [0.09, 0.075, 0.06] }
const ARM_REACHING: LimbPose = { joints: [[0.12, -0.12], [0.24, -0.28], [0.23, -0.45]], toes: [-2.0, -1.57, -1.15], widths: [0.09, 0.075, 0.06] }
const LEG_TOE = { reach: 0.08, r: 0.036 }
const ARM_TOE = { reach: 0.06, r: 0.03 }

// Everything the frog is made of, so the sticker outline can be drawn around all of it before any fill.
type Part =
  | { kind: 'tube'; from: P; to: P; width: number; color: string }
  | { kind: 'circle'; at: P; r: number; color: string }
  | { kind: 'poly'; points: P[]; color: string }
  | { kind: 'body'; color: string }

function limbParts(limb: LimbPose, toe: { reach: number; r: number }, side: number): Part[] {
  const m = (p: P): P => [p[0] * side, p[1]]
  const parts: Part[] = []
  const pads: Part[] = []
  const end = limb.joints[limb.joints.length - 1]
  for (const a of limb.toes) {
    const tip: P = [end[0] + Math.cos(a) * toe.reach, end[1] + Math.sin(a) * toe.reach]
    parts.push({ kind: 'tube', from: m(end), to: m(tip), width: toe.r * 0.9, color: LIMB })
    pads.push({ kind: 'circle', at: m(tip), r: toe.r, color: TOE })
  }
  // Each segment is a quad tapering from one joint's width to the next, with a round joint on every bend.
  for (let i = 0; i < limb.joints.length - 1; i++) {
    const [a, b] = [limb.joints[i], limb.joints[i + 1]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / len
    const ny = (b[0] - a[0]) / len
    const wa = limb.widths[i] / 2
    const wb = limb.widths[i + 1] / 2
    parts.push({
      kind: 'poly',
      points: [
        m([a[0] + nx * wa, a[1] + ny * wa]),
        m([b[0] + nx * wb, b[1] + ny * wb]),
        m([b[0] - nx * wb, b[1] - ny * wb]),
        m([a[0] - nx * wa, a[1] - ny * wa]),
      ],
      color: LIMB,
    })
  }
  limb.joints.forEach((j, i) => parts.push({ kind: 'circle', at: m(j), r: limb.widths[i] / 2, color: LIMB }))
  // Toe pads go on top so the folded haunch never hides them.
  return [...parts, ...pads]
}

function tracePart(ctx: CanvasRenderingContext2D, part: Part) {
  ctx.beginPath()
  if (part.kind === 'tube') {
    ctx.moveTo(part.from[0], part.from[1])
    ctx.lineTo(part.to[0], part.to[1])
  } else if (part.kind === 'circle') {
    ctx.arc(part.at[0], part.at[1], part.r, 0, Math.PI * 2)
  } else if (part.kind === 'poly') {
    part.points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
    ctx.closePath()
  } else {
    // Teardrop body: broad, rounded head end narrowing to the rump.
    ctx.moveTo(0, -0.34)
    ctx.bezierCurveTo(0.2, -0.34, 0.28, -0.2, 0.26, -0.04)
    ctx.bezierCurveTo(0.24, 0.13, 0.1, 0.3, 0, 0.37)
    ctx.bezierCurveTo(-0.1, 0.3, -0.24, 0.13, -0.26, -0.04)
    ctx.bezierCurveTo(-0.28, -0.2, -0.2, -0.34, 0, -0.34)
    ctx.closePath()
  }
}

// Draws one pass over every part: outline passes thicken each part by `grow`, the last pass fills.
function pass(ctx: CanvasRenderingContext2D, parts: Part[], grow: number, color: string | null) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const part of parts) {
    tracePart(ctx, part)
    if (part.kind === 'tube') {
      ctx.lineWidth = part.width + grow * 2
      ctx.strokeStyle = color ?? part.color
      ctx.stroke()
    } else if (color) {
      ctx.lineWidth = grow * 2
      ctx.strokeStyle = color
      ctx.stroke()
      ctx.fillStyle = color
      ctx.fill()
    } else {
      ctx.fillStyle = part.color
      ctx.fill()
    }
  }
}

// Soft shadow on the pad or water below the frog; it shrinks and fades as the frog rises.
export function drawFrogShadow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, lift: number) {
  const k = 1 / (1 + lift / (size * 1.6))
  ctx.beginPath()
  ctx.ellipse(x + size * 0.06, y + size * 0.1, size * 0.38 * k, size * 0.32 * k, 0, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(60, 70, 86, ${0.2 * k})`
  ctx.fill()
}

/** Draws the frog centred at (x, y), about `size` pixels across when sitting, facing `pose.heading`. */
export function drawFrog(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pose: FrogPose) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size, size)
  ctx.rotate(pose.heading)
  ctx.scale(1 + (1 - pose.squash) * 0.8, pose.squash)

  const leg = lerpLimb(LEG_FOLDED, LEG_KICKED, pose.legs)
  const arm = lerpLimb(ARM_PLANTED, ARM_REACHING, pose.arms)
  const parts: Part[] = []
  for (const side of [-1, 1]) {
    parts.push(...limbParts(leg, LEG_TOE, side))
    parts.push(...limbParts(arm, ARM_TOE, side))
  }
  // Eyes bulge from the front corners of the head, half outside the body, each with an orange lid over it.
  const body: Part[] = [{ kind: 'body', color: BODY }]
  const eyes: Part[] = [
    { kind: 'circle', at: [-0.21, -0.27], r: 0.075, color: EYE },
    { kind: 'circle', at: [0.21, -0.27], r: 0.075, color: EYE },
  ]
  const lids: Part[] = [
    { kind: 'circle', at: [-0.18, -0.235], r: 0.07, color: LIMB },
    { kind: 'circle', at: [0.18, -0.235], r: 0.07, color: LIMB },
  ]
  const all = [...parts, ...eyes, ...body]

  // The sticker outline goes round the whole frog first, then the limbs, body, eyes and lids are filled on top.
  const px = 1 / size
  pass(ctx, all, px * 4, STICKER_EDGE)
  pass(ctx, all, px * 3, STICKER)
  pass(ctx, parts, 0, null)
  pass(ctx, body, 0, null)
  pass(ctx, eyes, 0, null)
  pass(ctx, lids, 0, null)

  // A small glint on the visible part of each eye.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(side * 0.235, -0.3, 0.016, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/** Heading that points the frog from one screen point to another, clockwise from "up the screen". */
export function headingTo(dx: number, dy: number) {
  return Math.atan2(dx, -dy)
}
