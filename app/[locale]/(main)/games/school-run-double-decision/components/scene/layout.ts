// Scene geometry. The street is a 2:1 isometric view: `u` runs down-right along the road,
// `v` runs down-left across it, `z` is height. The snack held up by the child stepping out of
// the corner shop's door sits at the screen centre.

export type SceneSize = { width: number; height: number }
export type FieldLevel = 1 | 2 | 3

export const LANDSCAPE: SceneSize = { width: 960, height: 600 }
export const PORTRAIT: SceneSize = { width: 600, height: 760 }

// Narrow screens get a taller view so the sprites stay a readable size.
export function sceneSizeFor(cssWidth: number): SceneSize {
  return cssWidth < 640 ? PORTRAIT : LANDSCAPE
}

// The corner shop: a box whose front face looks down-left onto the pavement and road.
export const SHOP = { u0: -80, u1: 80, v0: -100, v1: 20, height: 100 }
export const SIGN = { width: 132, height: 72 }
// Height of the sign's centre; the sign stands on short posts on the front edge of the shop roof.
export const SIGN_Z = 148
// World units to screen pixels, zoomed in so the shop fills the middle of the view.
export const ISO_ZOOM = 1.35
// Where the child who walks out of the shop door during the flash starts, just outside the door.
export const HERO = { u: 0, v: SHOP.v1 + 6 }
// Screen pixels from the child's feet up to the middle of the snack they hold up.
export const HERO_LIFT = 84

// Bands across the street, by `v`.
export const STREET = {
  pavementNear: [SHOP.v1, 62] as const,
  road: [62, 162] as const,
  pavementFar: [162, 200] as const,
}
export const LANES: [v: number, dir: 1 | -1][] = [[88, 1], [136, -1]]
// The zebra crossing runs straight out from the shop door.
export const CROSSING = { u0: -30, u1: 30 }
// Utility poles on the pavement, depth-sorted with the moving sprites.
export const POLES: [u: number, v: number][] = [[-230, 56], [170, 56]]
// Trees behind the row of shops, part of the background.
export const BACK_TREES: [u: number, v: number, r: number][] = [
  [-440, -160, 20],
  [-330, -230, 18],
  [-170, -290, 22],
  [-40, -420, 18],
]

// Neighbouring buildings and the school behind, drawn once into the background.
export const BUILDINGS = [
  { u0: -250, u1: -110, v0: -90, v1: 20, height: 72, kind: 'house' as const },
  { u0: 110, u1: 250, v0: -90, v1: 20, height: 84, kind: 'flats' as const },
  { u0: -300, u1: -140, v0: -420, v1: -340, height: 70, kind: 'school' as const },
]

// Projects a ground point and height to the screen, with the child's held-up snack at the centre.
export function isoProject({ width, height }: SceneSize, u: number, v: number, z = 0) {
  const du = u - HERO.u
  const dv = v - HERO.v
  return {
    x: width / 2 + ISO_ZOOM * (du - dv),
    y: height / 2 + HERO_LIFT + ISO_ZOOM * ((du + dv) / 2 - z),
  }
}

export function center({ width, height }: SceneSize) {
  return { x: width / 2, y: height / 2 }
}

// Share of the scene's half-width and half-height used by the ring of paper plane slots.
const FIELD_RADIUS: Record<FieldLevel, number> = { 1: 0.54, 2: 0.72, 3: 0.86 }

export const SLOT_COUNT = 8

export function slotPosition(index: number, level: FieldLevel, size: SceneSize) {
  const angle = (index * Math.PI) / 4 - Math.PI / 2
  const f = FIELD_RADIUS[level]
  return {
    x: size.width / 2 + Math.cos(angle) * (size.width / 2) * f,
    y: size.height / 2 + Math.sin(angle) * (size.height / 2) * f,
  }
}
