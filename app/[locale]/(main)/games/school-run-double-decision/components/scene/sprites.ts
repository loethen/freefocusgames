// Memphis-style drawing in a fresh, light palette: airy pastels, soft slate outlines and pale offset shadows.
// Everything is drawn with paths, so the scene needs no image assets and stays sharp at any pixel ratio.

import {
  type SceneSize,
  BACK_TREES,
  BUILDINGS,
  CROSSING,
  ISO_ZOOM,
  SHOP,
  SIGN,
  SIGN_Z,
  STREET,
  isoProject,
} from './layout'

export const INK = '#3c4656'
// Pale offset shadow behind shapes, a tint of the outline rather than solid ink.
const SHADOW = 'rgba(60, 70, 86, 0.28)'
export const COLORS = {
  ground: '#fbf8ef',
  plaza: '#f4f0e3',
  sidewalk: '#ece5d6',
  road: '#9aa9bb',
  roadLine: '#fdfcf7',
  grass: '#d6ecd2',
  coral: '#f6b0a0',
  yellow: '#fbe3a1',
  mint: '#a8dcc8',
  lilac: '#cfc3ec',
  blue: '#a9d2ef',
  pink: '#f7c6d4',
  orange: '#f8c99b',
  tan: '#efd2a4',
  cream: '#fffdf7',
  skin: '#fbe0cd',
  // The target colour stays strong so the red plane still stands out.
  red: '#ef5a4f',
  green: '#7cc49a',
  white: '#ffffff',
}

export type SnackKind = 'icecream' | 'lollipop' | 'donut' | 'cookie' | 'juice' | 'burger'
// Things flying over the street: paper planes, plus red kites and balloons that only look like the target.
export type FlyerKind = 'red' | 'blue' | 'green' | 'purple' | 'red-kite' | 'red-balloon'
export type ConfettiShape = 'triangle' | 'squiggle' | 'ring' | 'zigzag'

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

function inked(ctx: CanvasRenderingContext2D, fill: string, lineWidth = 3) {
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke()
}

// Fills the same path once, offset down and right, as the flat Memphis drop shadow.
function hardShadow(ctx: CanvasRenderingContext2D, offset: number, path: () => void) {
  ctx.save()
  ctx.translate(offset, offset)
  path()
  ctx.fillStyle = SHADOW
  ctx.fill()
  ctx.restore()
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

export function drawConfetti(
  ctx: CanvasRenderingContext2D,
  shape: ConfettiShape,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  lineWidth = 3,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (shape === 'triangle') {
    ctx.beginPath()
    ctx.moveTo(0, -size / 2)
    ctx.lineTo(size / 2, size / 2)
    ctx.lineTo(-size / 2, size / 2)
    ctx.closePath()
    inked(ctx, color, lineWidth * 0.8)
  } else if (shape === 'ring') {
    ctx.beginPath()
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
    ctx.lineWidth = lineWidth * 1.6
    ctx.strokeStyle = color
    ctx.stroke()
  } else {
    ctx.beginPath()
    const steps = shape === 'zigzag' ? 4 : 12
    for (let i = 0; i <= steps; i++) {
      const px = -size / 2 + (size * i) / steps
      const py = shape === 'zigzag' ? (i % 2 === 0 ? -size / 6 : size / 6) : Math.sin((i / steps) * Math.PI * 2) * (size / 6)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.stroke()
  }
  ctx.restore()
}

type Point = { x: number; y: number }
type Box = { u0: number; u1: number; v0: number; v1: number; z0?: number; z1: number }

function polygon(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath()
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
}

// Mixes a hex colour toward white (amount > 0) or ink (amount < 0) for the lit and shaded faces.
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const target = amount > 0 ? 255 : 29
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(amount))
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}

function groundQuad(ctx: CanvasRenderingContext2D, size: SceneSize, u0: number, u1: number, v0: number, v1: number) {
  polygon(ctx, [isoProject(size, u0, v0), isoProject(size, u1, v0), isoProject(size, u1, v1), isoProject(size, u0, v1)])
}

// A quad on the front face of a box, the plane at v = `v` facing down-left.
function frontQuad(ctx: CanvasRenderingContext2D, size: SceneSize, v: number, u0: number, u1: number, z0: number, z1: number) {
  polygon(ctx, [isoProject(size, u0, v, z0), isoProject(size, u1, v, z0), isoProject(size, u1, v, z1), isoProject(size, u0, v, z1)])
}

// A quad on the side face of a box, the plane at u = `u` facing down-right.
function sideQuad(ctx: CanvasRenderingContext2D, size: SceneSize, u: number, v0: number, v1: number, z0: number, z1: number) {
  polygon(ctx, [isoProject(size, u, v1, z0), isoProject(size, u, v0, z0), isoProject(size, u, v0, z1), isoProject(size, u, v1, z1)])
}

// The three visible faces of a box: the front (down-left), the side (down-right) and the top.
export function isoBox(ctx: CanvasRenderingContext2D, size: SceneSize, box: Box, color: string, lineWidth = 3) {
  const { u0, u1, v0, v1, z1 } = box
  const z0 = box.z0 ?? 0
  frontQuad(ctx, size, v1, u0, u1, z0, z1)
  inked(ctx, color, lineWidth)
  sideQuad(ctx, size, u1, v0, v1, z0, z1)
  inked(ctx, shade(color, -0.22), lineWidth)
  polygon(ctx, [isoProject(size, u0, v0, z1), isoProject(size, u1, v0, z1), isoProject(size, u1, v1, z1), isoProject(size, u0, v1, z1)])
  inked(ctx, shade(color, 0.45), lineWidth)
}

// A grid of windows on the front face, and optionally the side face, of a box.
function windows(ctx: CanvasRenderingContext2D, size: SceneSize, box: Box, cols: number, rows: number, side: boolean) {
  const { u0, u1, v0, v1, z1 } = box
  const cellU = (u1 - u0) / cols
  const cellZ = (z1 - 10) / rows
  for (let r = 0; r < rows; r++) {
    const z = 8 + r * cellZ
    for (let c = 0; c < cols; c++) {
      frontQuad(ctx, size, v1, u0 + c * cellU + cellU * 0.25, u0 + c * cellU + cellU * 0.75, z + cellZ * 0.25, z + cellZ * 0.8)
      inked(ctx, '#d8eefa', 2)
    }
    if (side) {
      const sideCols = Math.max(1, Math.round((v1 - v0) / cellU))
      const cellV = (v1 - v0) / sideCols
      for (let c = 0; c < sideCols; c++) {
        sideQuad(ctx, size, u1, v0 + c * cellV + cellV * 0.25, v0 + c * cellV + cellV * 0.75, z + cellZ * 0.25, z + cellZ * 0.8)
        inked(ctx, '#c3e2f2', 2)
      }
    }
  }
}

// A tree standing on the ground at (x, y).
export function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = INK
  ctx.fillRect(x - 2.5, y - r - 6, 5, r + 6)
  ctx.beginPath()
  ctx.ellipse(x, y, r * 0.7, r * 0.3, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(60,70,86,0.15)'
  ctx.fill()
  hardShadow(ctx, 3, () => {
    ctx.beginPath()
    ctx.arc(x, y - r * 1.8, r, 0, Math.PI * 2)
  })
  ctx.beginPath()
  ctx.arc(x, y - r * 1.8, r, 0, Math.PI * 2)
  inked(ctx, COLORS.mint, 2.5)
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 2.1, r * 0.25, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()
}

// A utility pole standing on the ground at (x, y).
export function drawPole(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(ISO_ZOOM, ISO_ZOOM)
  ctx.fillStyle = INK
  ctx.fillRect(-2.5, -150, 5, 150)
  ctx.fillRect(-18, -138, 36, 4)
  ctx.fillRect(-12, -124, 24, 3)
  ctx.restore()
}

// The still part of the scene, drawn once into an offscreen canvas: ground, street and buildings.
export function drawBackground(ctx: CanvasRenderingContext2D, size: SceneSize, signLabel: string) {
  const rand = seeded(11)
  ctx.fillStyle = COLORS.ground
  ctx.fillRect(0, 0, size.width, size.height)

  // Grass behind the shops and beyond the far pavement.
  groundQuad(ctx, size, -1200, 1200, -1200, BUILDINGS[0].v0 - 10)
  ctx.fillStyle = COLORS.grass
  ctx.fill()
  groundQuad(ctx, size, -1200, 1200, STREET.pavementFar[1], 1200)
  ctx.fill()

  // A few pale Memphis shapes on the grass and ground.
  const shapes: ConfettiShape[] = ['triangle', 'squiggle', 'ring', 'zigzag']
  const pastel = [COLORS.lilac, COLORS.mint, COLORS.yellow, COLORS.pink, COLORS.blue]
  ctx.globalAlpha = 0.45
  for (let i = 0; i < 18; i++) {
    drawConfetti(ctx, shapes[i % 4], rand() * size.width, rand() * size.height, 10 + rand() * 8, rand() * Math.PI, pastel[i % 5], 2)
  }
  ctx.globalAlpha = 1

  for (const [v0, v1] of [STREET.pavementNear, STREET.pavementFar]) {
    groundQuad(ctx, size, -1200, 1200, v0, v1)
    ctx.fillStyle = COLORS.sidewalk
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,70,86,0.14)'
    ctx.lineWidth = 1
    for (let u = -1200; u < 1200; u += 28) {
      const a = isoProject(size, u, v0)
      const b = isoProject(size, u, v1)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  const [roadV0, roadV1] = STREET.road
  groundQuad(ctx, size, -1200, 1200, roadV0, roadV1)
  ctx.fillStyle = COLORS.road
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  for (const v of [roadV0, roadV1]) {
    const a = isoProject(size, -1200, v)
    const b = isoProject(size, 1200, v)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.strokeStyle = COLORS.roadLine
  ctx.setLineDash([18, 14])
  const midA = isoProject(size, -1200, (roadV0 + roadV1) / 2)
  const midB = isoProject(size, 1200, (roadV0 + roadV1) / 2)
  ctx.beginPath()
  ctx.moveTo(midA.x, midA.y)
  ctx.lineTo(midB.x, midB.y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = COLORS.white
  for (let u = CROSSING.u0; u < CROSSING.u1; u += 12) {
    groundQuad(ctx, size, u, u + 7, roadV0 + 5, roadV1 - 5)
    ctx.fill()
  }

  for (const [u, v, r] of BACK_TREES) {
    const p = isoProject(size, u, v)
    drawTree(ctx, p.x, p.y, r * ISO_ZOOM)
  }

  // Buildings back to front: the school, then the row along the street.
  const [house, flats, school] = BUILDINGS
  isoBox(ctx, size, { ...school, z1: school.height }, COLORS.coral)
  windows(ctx, size, { ...school, z1: school.height }, 6, 3, true)
  const roofFlag = isoProject(size, (school.u0 + school.u1) / 2, (school.v0 + school.v1) / 2, school.height)
  ctx.fillStyle = INK
  ctx.fillRect(roofFlag.x - 1.5, roofFlag.y - 40, 3, 40)
  polygon(ctx, [{ x: roofFlag.x + 1.5, y: roofFlag.y - 40 }, { x: roofFlag.x + 28, y: roofFlag.y - 33 }, { x: roofFlag.x + 1.5, y: roofFlag.y - 26 }])
  inked(ctx, COLORS.yellow, 2)

  isoBox(ctx, size, { ...house, z1: house.height }, COLORS.lilac)
  windows(ctx, size, { ...house, z1: house.height }, 3, 2, false)
  drawShop(ctx, size)
  drawSign(ctx, size, signLabel)
  isoBox(ctx, size, { ...flats, z1: flats.height }, COLORS.mint)
  windows(ctx, size, { ...flats, z1: flats.height }, 3, 3, true)
}

// The corner shop: yellow walls, a striped awning, a door and two shop windows.
function drawShop(ctx: CanvasRenderingContext2D, size: SceneSize) {
  const { u0, u1, v0, v1, height } = SHOP
  isoBox(ctx, size, { u0, u1, v0, v1, z1: height }, COLORS.yellow)
  frontQuad(ctx, size, v1, -18, 18, 0, 52)
  inked(ctx, COLORS.blue, 2.5)
  for (const [a, b] of [[u0 + 12, -28], [28, u1 - 12]]) {
    frontQuad(ctx, size, v1, a, b, 16, 50)
    inked(ctx, '#d8eefa', 2.5)
  }
  const stripes = 10
  const step = (u1 - u0 - 8) / stripes
  for (let i = 0; i < stripes; i++) {
    const a = u0 + 4 + i * step
    polygon(ctx, [
      isoProject(size, a, v1, 76),
      isoProject(size, a + step, v1, 76),
      isoProject(size, a + step, v1 + 24, 60),
      isoProject(size, a, v1 + 24, 60),
    ])
    ctx.fillStyle = i % 2 === 0 ? COLORS.coral : COLORS.white
    ctx.fill()
  }
  polygon(ctx, [
    isoProject(size, u0 + 4, v1, 76),
    isoProject(size, u1 - 4, v1, 76),
    isoProject(size, u1 - 4, v1 + 24, 60),
    isoProject(size, u0 + 4, v1 + 24, 60),
  ])
  ctx.lineWidth = 2.5
  ctx.strokeStyle = INK
  ctx.stroke()
}

// The shop sign on the front edge of the roof, in the same plane as the shop front, so it is
// sheared like the front wall.
function drawSign(ctx: CanvasRenderingContext2D, size: SceneSize, label: string) {
  const { width: w, height: h } = SIGN
  const { x, y } = isoProject(size, 0, SHOP.v1, SIGN_Z)
  const postLength = (SIGN_Z - SHOP.height) * ISO_ZOOM - h / 2
  ctx.save()
  // Along the front face, +u runs right and half a step down on screen; height stays vertical.
  ctx.transform(1, 0.5, 0, 1, x, y)
  ctx.fillStyle = INK
  ctx.fillRect(-w / 2 + 20, h / 2, 5, postLength)
  ctx.fillRect(w / 2 - 25, h / 2, 5, postLength)
  hardShadow(ctx, 5, () => roundRectPath(ctx, -w / 2, -h / 2, w, h, 14))
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 14)
  inked(ctx, COLORS.coral, 3.5)
  roundRectPath(ctx, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 9)
  inked(ctx, COLORS.cream, 2.5)
  ctx.fillStyle = INK
  ctx.font = '800 26px ui-sans-serif, system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 0, 2, w - 28)
  ctx.restore()
}

// The round card above the child's head: the snack they bought, or a question mark while answering.
export function drawSnackCard(ctx: CanvasRenderingContext2D, x: number, y: number, content: SnackKind | 'question') {
  const r = 27
  hardShadow(ctx, 4, () => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
  })
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  inked(ctx, COLORS.cream, 3)
  if (content === 'question') {
    ctx.fillStyle = INK
    ctx.font = '800 30px ui-sans-serif, system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', x, y + 2)
  } else {
    drawSnack(ctx, content, x, y, 40)
  }
}

// A wheel on the near side of a vehicle, centred at height `z`.
function wheel(ctx: CanvasRenderingContext2D, size: SceneSize, u: number, v: number, z: number, r: number) {
  const p = isoProject(size, u, v, z)
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, r * ISO_ZOOM, r * ISO_ZOOM * 1.1, 0, 0, Math.PI * 2)
  ctx.fillStyle = INK
  ctx.fill()
  ctx.beginPath()
  ctx.arc(p.x, p.y, r * ISO_ZOOM * 0.42, 0, Math.PI * 2)
  ctx.fillStyle = '#d9d6e3'
  ctx.fill()
}

// A car or school bus on the road, driving toward +u when `dir` is 1. (u, v) is its centre. The
// near long side faces the viewer; the visible end is the nose when driving toward +u, else the tail.
export function drawCar(
  ctx: CanvasRenderingContext2D,
  size: SceneSize,
  u: number,
  v: number,
  color: string,
  bus: boolean,
  dir: 1 | -1,
) {
  const length = bus ? 112 : 66
  const half = bus ? 15 : 14
  const u0 = u - length / 2
  const u1 = u + length / 2
  const v1 = v + half
  const body = bus ? COLORS.yellow : color
  const glass = '#d8eefa'

  // Soft shadow on the road.
  groundQuad(ctx, size, u0 + 2, u1 + 6, v - half + 2, v1 + 5)
  ctx.fillStyle = 'rgba(60,70,86,0.22)'
  ctx.fill()

  if (bus) {
    isoBox(ctx, size, { u0, u1, v0: v - half, v1, z0: 6, z1: 42 }, body, 2.5)
    // Black band and a row of windows along the side.
    frontQuad(ctx, size, v1, u0, u1, 16, 19)
    ctx.fillStyle = INK
    ctx.fill()
    const front = dir === 1 ? u1 : u0
    const doorU = dir === 1 ? u1 - 22 : u0 + 8
    for (let i = 0; i < 6; i++) {
      const a = u0 + 8 + i * 15
      if (a + 11 > doorU && a < doorU + 14) continue
      frontQuad(ctx, size, v1, a, a + 11, 24, 36)
      inked(ctx, glass, 1.8)
    }
    frontQuad(ctx, size, v1, doorU, doorU + 14, 8, 36)
    inked(ctx, COLORS.blue, 1.8)
    // Windscreen and headlights, or the rear window and tail lights.
    sideQuad(ctx, size, u1, v - half + 4, v1 - 4, 24, 37)
    inked(ctx, glass, 1.8)
    for (const lv of [v - half + 3, v1 - 8]) {
      sideQuad(ctx, size, u1, lv, lv + 5, 10, 14)
      inked(ctx, front === u1 ? COLORS.cream : COLORS.orange, 1.5)
    }
    wheel(ctx, size, u0 + 22, v1, 6, 7)
    wheel(ctx, size, u1 - 20, v1, 6, 7)
    return
  }

  // Lower body with a bumper strip and a white racing stripe.
  isoBox(ctx, size, { u0, u1, v0: v - half, v1, z0: 6, z1: 20 }, body, 2.5)
  frontQuad(ctx, size, v1, u0, u1, 6, 9)
  ctx.fillStyle = shade(body, -0.35)
  ctx.fill()
  frontQuad(ctx, size, v1, u0 + 4, u1 - 4, 13, 15.5)
  ctx.fillStyle = COLORS.white
  ctx.fill()

  // Cabin set back from the nose, with sloping glass at both ends and two side windows.
  const c0 = dir === 1 ? u0 + 10 : u0 + 18
  const c1 = dir === 1 ? u1 - 18 : u1 - 10
  const cv0 = v - half + 3
  const cv1 = v1 - 3
  polygon(ctx, [
    isoProject(size, c0, cv1, 20),
    isoProject(size, c1, cv1, 20),
    isoProject(size, c1 - 6, cv1, 33),
    isoProject(size, c0 + 6, cv1, 33),
  ])
  inked(ctx, body, 2.5)
  polygon(ctx, [
    isoProject(size, c1, cv1, 20),
    isoProject(size, c1, cv0, 20),
    isoProject(size, c1 - 6, cv0, 33),
    isoProject(size, c1 - 6, cv1, 33),
  ])
  inked(ctx, glass, 2.5)
  polygon(ctx, [
    isoProject(size, c0 + 6, cv0, 33),
    isoProject(size, c1 - 6, cv0, 33),
    isoProject(size, c1 - 6, cv1, 33),
    isoProject(size, c0 + 6, cv1, 33),
  ])
  inked(ctx, shade(body, 0.45), 2.5)
  const mid = (c0 + c1) / 2
  frontQuad(ctx, size, cv1, c0 + 6, mid - 2, 22, 30)
  inked(ctx, glass, 1.8)
  frontQuad(ctx, size, cv1, mid + 2, c1 - 6, 22, 30)
  inked(ctx, glass, 1.8)

  // Door seam on the side, then lights on the visible end.
  const seam = [isoProject(size, mid, v1, 8), isoProject(size, mid, v1, 19)]
  ctx.beginPath()
  ctx.moveTo(seam[0].x, seam[0].y)
  ctx.lineTo(seam[1].x, seam[1].y)
  ctx.lineWidth = 1.5
  ctx.strokeStyle = INK
  ctx.stroke()
  for (const lv of [v - half + 3, v1 - 8]) {
    sideQuad(ctx, size, u1, lv, lv + 5, 12, 16)
    inked(ctx, dir === 1 ? COLORS.cream : COLORS.orange, 1.5)
  }
  wheel(ctx, size, u0 + 14, v1, 6, 6)
  wheel(ctx, size, u1 - 14, v1, 6, 6)
}

// A leaf blown by the wind, centred on (x, y) and `size` long, with its midrib.
export function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, color: string) {
  const h = size / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(-h, 0)
  ctx.quadraticCurveTo(0, -h * 0.75, h, 0)
  ctx.quadraticCurveTo(0, h * 0.75, -h, 0)
  ctx.closePath()
  inked(ctx, color, 2)
  ctx.beginPath()
  ctx.moveTo(-h * 1.15, 0)
  ctx.lineTo(h * 0.7, 0)
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

// A round-tipped flower petal, centred on (x, y) and `size` long.
export function drawPetal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, color: string) {
  const h = size / 2
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(-h, 0)
  ctx.bezierCurveTo(-h * 0.2, -h * 0.9, h, -h * 0.7, h, 0)
  ctx.bezierCurveTo(h, h * 0.7, -h * 0.2, h * 0.9, -h, 0)
  ctx.closePath()
  inked(ctx, color, 1.8)
  ctx.restore()
}

export function drawFixation(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.arc(x, y, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.red
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = COLORS.white
  ctx.stroke()
}

// Draws a snack centred on (x, y), fitting a box of `size`.
export function drawSnack(ctx: CanvasRenderingContext2D, kind: SnackKind, x: number, y: number, size: number) {
  const s = size / 50
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  switch (kind) {
    case 'icecream':
      ctx.beginPath()
      ctx.moveTo(-11, -2)
      ctx.lineTo(11, -2)
      ctx.lineTo(0, 22)
      ctx.closePath()
      inked(ctx, COLORS.tan, 2.5)
      ctx.beginPath()
      ctx.arc(0, -9, 12, Math.PI * 0.9, Math.PI * 2.1)
      ctx.closePath()
      inked(ctx, COLORS.pink, 2.5)
      break
    case 'lollipop':
      ctx.fillStyle = INK
      ctx.fillRect(-1.5, 2, 3, 22)
      ctx.beginPath()
      ctx.arc(0, -6, 14, 0, Math.PI * 2)
      inked(ctx, COLORS.lilac, 2.5)
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 5; a += 0.2) {
        const r = (a / (Math.PI * 5)) * 11
        const px = Math.cos(a) * r
        const py = -6 + Math.sin(a) * r
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.lineWidth = 2
      ctx.strokeStyle = COLORS.white
      ctx.stroke()
      break
    case 'donut':
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      inked(ctx, COLORS.tan, 2.5)
      ctx.beginPath()
      ctx.arc(0, 0, 14, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.pink
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, 6, 0, Math.PI * 2)
      inked(ctx, COLORS.cream, 2.5)
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        ctx.save()
        ctx.translate(Math.cos(a) * 10, Math.sin(a) * 10)
        ctx.rotate(a * 2)
        ctx.fillStyle = [COLORS.blue, COLORS.yellow, COLORS.mint][i % 3]
        ctx.fillRect(-2.5, -1, 5, 2)
        ctx.restore()
      }
      break
    case 'cookie':
      ctx.beginPath()
      ctx.arc(0, 0, 18, 0, Math.PI * 2)
      inked(ctx, COLORS.tan, 2.5)
      for (const [cx, cy] of [[-7, -6], [6, -8], [8, 5], [-4, 8], [0, -1], [-10, 3]]) {
        ctx.beginPath()
        ctx.arc(cx, cy, 2.4, 0, Math.PI * 2)
        ctx.fillStyle = INK
        ctx.fill()
      }
      break
    case 'juice':
      roundRectPath(ctx, -11, -12, 22, 30, 3)
      inked(ctx, COLORS.mint, 2.5)
      ctx.beginPath()
      ctx.arc(0, 4, 6, 0, Math.PI * 2)
      inked(ctx, COLORS.orange, 2)
      ctx.beginPath()
      ctx.moveTo(4, -12)
      ctx.lineTo(4, -20)
      ctx.lineTo(10, -24)
      ctx.lineWidth = 2.5
      ctx.strokeStyle = INK
      ctx.stroke()
      break
    case 'burger':
      ctx.beginPath()
      ctx.arc(0, -3, 17, Math.PI, Math.PI * 2)
      ctx.closePath()
      inked(ctx, COLORS.tan, 2.5)
      roundRectPath(ctx, -18, -1, 36, 6, 3)
      inked(ctx, '#a6d78f', 2)
      roundRectPath(ctx, -17, 5, 34, 7, 3)
      inked(ctx, '#b98266', 2)
      roundRectPath(ctx, -16, 12, 32, 7, 4)
      inked(ctx, COLORS.tan, 2.5)
      break
  }
  ctx.restore()
}

const FLYER_COLORS: Record<FlyerKind, string> = {
  red: COLORS.red,
  blue: COLORS.blue,
  green: '#a6d78f',
  purple: COLORS.lilac,
  'red-kite': COLORS.red,
  'red-balloon': COLORS.red,
}

// A flyer centred on (x, y). Paper planes point along `heading` (radians, 0 = right); kites and
// balloons stay upright.
export function drawFlyer(ctx: CanvasRenderingContext2D, kind: FlyerKind, x: number, y: number, size: number, heading: number) {
  const color = FLYER_COLORS[kind]
  ctx.save()
  ctx.translate(x, y)
  ctx.lineJoin = 'round'
  if (kind === 'red-balloon') {
    const r = size * 0.85
    ctx.beginPath()
    ctx.moveTo(0, r)
    ctx.quadraticCurveTo(-r * 0.5, r * 1.7, 0, r * 2.3)
    ctx.lineWidth = 2
    ctx.strokeStyle = INK
    ctx.stroke()
    const body = () => {
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.88, r, 0, 0, Math.PI * 2)
    }
    hardShadow(ctx, 3, body)
    body()
    inked(ctx, color, 2.5)
  } else if (kind === 'red-kite') {
    const r = size
    ctx.beginPath()
    ctx.moveTo(0, r)
    ctx.quadraticCurveTo(r * 0.5, r * 1.5, -r * 0.2, r * 2.1)
    ctx.lineWidth = 2
    ctx.strokeStyle = INK
    ctx.stroke()
    const body = () => polygon(ctx, [{ x: 0, y: -r * 1.1 }, { x: r * 0.8, y: -r * 0.1 }, { x: 0, y: r }, { x: -r * 0.8, y: -r * 0.1 }])
    hardShadow(ctx, 3, body)
    body()
    inked(ctx, color, 2.5)
    ctx.beginPath()
    ctx.moveTo(0, -r * 1.1)
    ctx.lineTo(0, r)
    ctx.moveTo(-r * 0.8, -r * 0.1)
    ctx.lineTo(r * 0.8, -r * 0.1)
    ctx.lineWidth = 1.5
    ctx.stroke()
  } else {
    // A paper dart seen from above: two wings meeting at the centre fold.
    ctx.rotate(heading)
    const s = size
    const outline = () => polygon(ctx, [{ x: s, y: 0 }, { x: -s, y: -s * 0.75 }, { x: -s * 0.55, y: 0 }, { x: -s, y: s * 0.75 }])
    hardShadow(ctx, 3, outline)
    polygon(ctx, [{ x: s, y: 0 }, { x: -s, y: -s * 0.75 }, { x: -s * 0.55, y: 0 }])
    ctx.fillStyle = color
    ctx.fill()
    polygon(ctx, [{ x: s, y: 0 }, { x: -s * 0.55, y: 0 }, { x: -s, y: s * 0.75 }])
    ctx.fillStyle = shade(color, -0.25)
    ctx.fill()
    outline()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s, 0)
    ctx.lineTo(-s * 0.55, 0)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.restore()
}

// Eyes, rosy cheeks and a smile on a child's head centred at (x, by - 13).
function drawFace(ctx: CanvasRenderingContext2D, x: number, by: number) {
  ctx.fillStyle = INK
  for (const ex of [x - 2.2, x + 2.2]) {
    ctx.beginPath()
    ctx.arc(ex, by - 12.3, 0.9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,120,150,0.55)'
  for (const cx of [x - 3.7, x + 3.7]) {
    ctx.beginPath()
    ctx.arc(cx, by - 10.5, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(x, by - 11, 1.8, 0.15 * Math.PI, 0.85 * Math.PI)
  ctx.lineWidth = 1
  ctx.strokeStyle = INK
  ctx.stroke()
}

// Which way a child faces on screen. Walking down the screen shows their front, walking up shows
// their back; the 3/4 views are drawn walking right and mirrored for left.
export type KidFacing = 'front' | 'front-right' | 'front-left' | 'back-right' | 'back-left'

const HAIR = '#9a7a62'

// A child in a yellow school cap with a backpack, standing at (x, y + 14). `step` drives the walk
// cycle: feet stride and arms swing along the way they face. With `raisedArm` the right arm is left
// out, for a caller that draws it held up. Only the child with the snack gets a `face`; the
// passers-by stay plain so they don't pull the eye.
export function drawKid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  step: number,
  shirt: string,
  bag: string,
  { facing = 'front', raisedArm = false, face = false }: { facing?: KidFacing; raisedArm?: boolean; face?: boolean } = {},
) {
  const back = facing.startsWith('back')
  const turned = facing !== 'front'
  const s = Math.sin(step)
  const by = -Math.abs(s) * 1.2
  // One stride on screen: right for the 3/4 views, and down toward the viewer or up away from it.
  const strideX = turned ? 2.4 : 0
  const strideY = back ? -1.2 : 1.3
  // The head leans a little the way they walk.
  const lean = turned ? 0.8 : 0
  const hipSpread = turned ? 1.8 : 2.5

  ctx.save()
  ctx.translate(x, y)
  if (facing.endsWith('left')) ctx.scale(-1, 1)
  ctx.lineCap = 'round'

  // Legs and shoes; the forward foot lifts a little.
  for (const side of [-1, 1]) {
    const phase = side === -1 ? s : -s
    const fx = side * hipSpread + strideX * phase
    const fy = 13 + strideY * phase - Math.max(0, phase) * 1.2
    ctx.beginPath()
    ctx.moveTo(side * hipSpread, by + 4)
    ctx.lineTo(fx, fy)
    ctx.lineWidth = 3.4
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = 1.8
    ctx.strokeStyle = COLORS.skin
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(fx + (turned ? 0.8 : 0), fy + 0.6, turned ? 2.8 : 2.4, 1.4, 0, 0, Math.PI * 2)
    ctx.fillStyle = INK
    ctx.fill()
  }

  // Seen from the front the backpack peeks out behind a shoulder.
  if (!back) {
    roundRectPath(ctx, turned ? -10 : 3.5, by - 6, turned ? 6 : 7, 10, 2.5)
    inked(ctx, bag, 1.5)
  }

  // Arms swing against the legs.
  for (const side of [-1, 1]) {
    if (raisedArm && side === 1) continue
    const phase = side === -1 ? -s : s
    ctx.beginPath()
    ctx.moveTo(side * 5.5, by - 4.5)
    ctx.lineTo(side * 6.3 + strideX * 0.9 * phase, by + 2.5 + strideY * 0.5 * phase)
    ctx.lineWidth = 3.6
    ctx.strokeStyle = INK
    ctx.stroke()
    ctx.lineWidth = 1.8
    ctx.strokeStyle = COLORS.skin
    ctx.stroke()
  }

  // Shorts and shirt.
  roundRectPath(ctx, -5, by + 1, 10, 5, 2)
  inked(ctx, '#8193bb', 1.5)
  roundRectPath(ctx, -6, by - 7, 12, 11, 4)
  inked(ctx, shirt, 1.8)

  if (back) {
    // The backpack covers most of the back.
    roundRectPath(ctx, -4.5, by - 6.5, 9, 10, 2.5)
    inked(ctx, bag, 1.5)
    roundRectPath(ctx, -3.5, by - 6.5, 7, 3.5, 1.5)
    inked(ctx, shade(bag, -0.25), 1.2)
  } else {
    // A backpack strap over the shoulder.
    const strap = turned ? -3.2 : 3.2
    ctx.beginPath()
    ctx.moveTo(strap, by - 6.5)
    ctx.lineTo(strap * 0.8, by + 2)
    ctx.lineWidth = 1.3
    ctx.strokeStyle = INK
    ctx.stroke()
  }

  // Head: from behind, hair covers the top with the neck showing below; from the front, hair
  // peeks out round the face.
  const hy = by - 13
  if (back) {
    ctx.beginPath()
    ctx.arc(lean, hy, 6, 0, Math.PI * 2)
    inked(ctx, COLORS.skin, 1.8)
    ctx.beginPath()
    ctx.arc(lean, hy, 6, Math.PI * 0.9, Math.PI * 0.1)
    ctx.closePath()
    inked(ctx, HAIR, 1.8)
  } else {
    ctx.beginPath()
    ctx.ellipse(lean - (turned ? 1.2 : 0), hy - 0.6, 6.9, 5.4, 0, 0, Math.PI * 2)
    ctx.fillStyle = HAIR
    ctx.fill()
    ctx.beginPath()
    ctx.arc(lean, hy, 6, 0, Math.PI * 2)
    inked(ctx, COLORS.skin, 1.8)
    if (face) drawFace(ctx, lean, by)
  }

  // Yellow school cap with a button on top. The brim points the way they face: across the front,
  // forward in the 3/4 view, and just poking out past the head from behind.
  ctx.beginPath()
  ctx.arc(lean, hy - 1.5, 6.3, Math.PI, Math.PI * 2)
  ctx.closePath()
  inked(ctx, COLORS.yellow, 1.8)
  ctx.fillStyle = INK
  if (back) roundRectPath(ctx, lean + 3.5, hy - 3.2, 5, 2, 1)
  else if (turned) roundRectPath(ctx, lean - 4, hy - 2.4, 12.5, 2.4, 1.2)
  else roundRectPath(ctx, -8, hy - 2.4, 16, 2.4, 1.2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(lean, hy - 7.8, 1.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, flap: number) {
  const wing = Math.sin(flap) * 6
  ctx.beginPath()
  ctx.moveTo(x - 11, y - wing)
  ctx.quadraticCurveTo(x - 5, y - 4, x, y)
  ctx.quadraticCurveTo(x + 5, y - 4, x + 11, y - wing)
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  ctx.stroke()
}

// Ring around a balloon slot in the feedback step: green on the answer, an X on a wrong pick.
export function drawSlotMark(ctx: CanvasRenderingContext2D, x: number, y: number, correct: boolean) {
  if (correct) {
    ctx.beginPath()
    ctx.arc(x, y, 28, 0, Math.PI * 2)
    ctx.lineWidth = 5
    ctx.strokeStyle = COLORS.green
    ctx.stroke()
    return
  }
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.strokeStyle = COLORS.red
  ctx.beginPath()
  ctx.moveTo(x - 14, y - 14)
  ctx.lineTo(x + 14, y + 14)
  ctx.moveTo(x + 14, y - 14)
  ctx.lineTo(x - 14, y + 14)
  ctx.stroke()
}
