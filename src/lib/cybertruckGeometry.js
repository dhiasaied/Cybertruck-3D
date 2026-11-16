import * as THREE from 'three'

/**
 * Procedural Cybertruck geometry.
 *
 * Units are metres, matching the real truck (~5.68 m long, ~2.0 m wide body,
 * ~1.79 m tall). Axes: +X = nose, +Y = up, Z = width (centred on 0).
 *
 * The body is built from two extruded side profiles:
 *  - LOWER: everything below the beltline (full width, slab sides, arches cut out)
 *  - UPPER: the greenhouse / sail pillars above the beltline, whose vertices are
 *    pulled inward linearly with height. Because the taper is linear in Y, every
 *    side-cap vertex stays on one plane, so the sides remain perfectly flat facets
 *    with a crisp crease at the beltline — the signature "origami" look.
 */

export const DIM = {
  halfWidth: 1.0,
  belt: 1.05,
  taper: 0.219, // inward pull per metre above beltline (roof ends ~84% width)
  tip: new THREE.Vector2(2.88, 0.93), // nose point / light bar edge
  apex: new THREE.Vector2(0.15, 1.78), // roof peak
  tail: new THREE.Vector2(-2.86, 1.22), // top of tailgate
  wheelBase: 3.8,
  wheelRadius: 0.43,
  trackHalf: 0.86,
}

const hoodSlope = (DIM.apex.y - DIM.tip.y) / (DIM.tip.x - DIM.apex.x)
/** x on the hood/windshield line for a given y */
export const hoodX = (y) => DIM.tip.x - (y - DIM.tip.y) / hoodSlope
/** y on the hood/windshield line for a given x */
export const hoodY = (x) => DIM.tip.y + (DIM.tip.x - x) * hoodSlope
/** half-width of the greenhouse at height y */
export const halfWidthAt = (y) =>
  y <= DIM.belt ? DIM.halfWidth : DIM.halfWidth * (1 - DIM.taper * (y - DIM.belt))

const ARCH = { bottomHalf: 0.66, topHalf: 0.5, top: 0.95, base: 0.42 }

function archPoints(cx) {
  // returned in the order walked from rear to front along the body bottom
  return [
    [cx - ARCH.bottomHalf, ARCH.base],
    [cx - ARCH.topHalf, ARCH.top],
    [cx + ARCH.topHalf, ARCH.top],
    [cx + ARCH.bottomHalf, ARCH.base],
  ]
}

function shapeFrom(points) {
  const s = new THREE.Shape()
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)))
  s.closePath()
  return s
}

function extrudeCentered(shape, depth) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 })
  g.translate(0, 0, -depth / 2)
  return g
}

function flatten(g) {
  const out = g.index ? g.toNonIndexed() : g
  out.computeVertexNormals()
  return out
}

export function buildLowerBody() {
  const fx = DIM.wheelBase / 2
  const beltX = hoodX(DIM.belt)
  const pts = [
    [2.76, 0.42],
    [DIM.tip.x, DIM.tip.y],
    [beltX, DIM.belt],
    [DIM.tail.x, DIM.belt],
    [DIM.tail.x, 0.6],
    [-2.76, 0.42],
    ...archPoints(-fx),
    ...archPoints(fx),
  ]
  return flatten(extrudeCentered(shapeFrom(pts), DIM.halfWidth * 2))
}

export function buildUpperBody() {
  const beltX = hoodX(DIM.belt)
  const pts = [
    [beltX, DIM.belt],
    [DIM.apex.x, DIM.apex.y],
    [DIM.tail.x, DIM.tail.y],
    [DIM.tail.x, DIM.belt],
  ]
  const g = extrudeCentered(shapeFrom(pts), DIM.halfWidth * 2)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    pos.setZ(i, pos.getZ(i) * (halfWidthAt(y) / DIM.halfWidth))
  }
  pos.needsUpdate = true
  return flatten(g)
}

/**
 * Quad lying on a sloped wall of the upper body (windshield / roof glass),
 * between parameters t0..t1 along segment p1->p2, inset from the side edges.
 */
function quadOnSegment(p1, p2, t0, t1, inset, offset = 0.006) {
  const a = new THREE.Vector2().lerpVectors(p1, p2, t0)
  const b = new THREE.Vector2().lerpVectors(p1, p2, t1)
  const d = new THREE.Vector2().subVectors(p2, p1).normalize()
  let n = new THREE.Vector2(-d.y, d.x)
  if (n.y < 0) n.negate() // outward = upward-facing
  const off = n.multiplyScalar(offset)
  const wa = halfWidthAt(a.y) - inset
  const wb = halfWidthAt(b.y) - inset
  const v = [
    [a.x + off.x, a.y + off.y, -wa],
    [a.x + off.x, a.y + off.y, wa],
    [b.x + off.x, b.y + off.y, wb],
    [b.x + off.x, b.y + off.y, -wb],
  ]
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3))
  g.setIndex([0, 1, 2, 0, 2, 3])
  g.computeVertexNormals()
  return g
}

export function buildWindshield() {
  const beltPt = new THREE.Vector2(hoodX(DIM.belt), DIM.belt)
  // start the glass a little above the beltline, run it almost to the apex
  return quadOnSegment(beltPt, DIM.apex, 0.32, 0.985, 0.09)
}

export function buildRoofGlass() {
  return quadOnSegment(DIM.apex, DIM.tail, 0.015, 0.33, 0.09)
}

/** Side windows (2 per side) projected onto the tapered side plane. */
export function buildSideWindows(side = 1) {
  const panes = [
    [
      [1.8, 1.13],
      [0.25, 1.69],
      [-0.35, 1.598],
      [-0.35, 1.13],
    ],
    [
      [-0.43, 1.13],
      [-0.43, 1.585],
      [-1.05, 1.49],
      [-1.05, 1.13],
    ],
  ]
  return panes.map((pts) => {
    const g = new THREE.ShapeGeometry(shapeFrom(pts))
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, side * (halfWidthAt(pos.getY(i)) + 0.006))
    }
    g.computeVertexNormals()
    return g
  })
}

/** U-shaped black fender trim that frames an arch (open at the bottom). */
export function buildArchTrim(cx) {
  const o = 0.08
  const pts = [
    [cx - ARCH.bottomHalf - o, ARCH.base],
    [cx - ARCH.topHalf - o * 0.6, ARCH.top + o],
    [cx + ARCH.topHalf + o * 0.6, ARCH.top + o],
    [cx + ARCH.bottomHalf + o, ARCH.base],
    [cx + ARCH.bottomHalf, ARCH.base],
    [cx + ARCH.topHalf, ARCH.top],
    [cx - ARCH.topHalf, ARCH.top],
    [cx - ARCH.bottomHalf, ARCH.base],
  ]
  const g = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: 0.035, bevelEnabled: false })
  return flatten(g)
}

/** Hexagonal aero wheel cover, extruded slightly. */
export function buildAeroCover(radius = 0.3) {
  const s = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    const p = [Math.cos(a) * radius, Math.sin(a) * radius]
    i === 0 ? s.moveTo(...p) : s.lineTo(...p)
  }
  s.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.07, 0, Math.PI * 2, true)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
  })
  return g
}

/** Procedural brushed-steel streak texture (used as roughness map). */
export function createBrushedTexture(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#c8c8c8'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * size
    const v = 150 + Math.random() * 105
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.4})`
    ctx.lineWidth = Math.random() * 1.4 + 0.2
    ctx.beginPath()
    const x = Math.random() * size
    ctx.moveTo(x - size, y)
    ctx.lineTo(x + size, y + (Math.random() - 0.5) * 2)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(0.6, 0.6)
  tex.anisotropy = 8
  return tex
}

/** Soft radial gradient texture for glow/underglow sprites. */
export function createRadialTexture(size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  return tex
}

/* ======================================================================== */
/* Opening panels (doors, frunk, tonneau) + mechanical parts                */
/* ======================================================================== */

/** x on the roof/tonneau line (apex -> tail) for a given y, and inverse */
const roofSlope = (DIM.apex.y - DIM.tail.y) / (DIM.apex.x - DIM.tail.x)
export const roofY = (x) => DIM.apex.y - (DIM.apex.x - x) * roofSlope

/** A flat polygon (xy) projected onto the tapered side plane of the body. */
export function sidePolygon(points, side, offset) {
  const g = new THREE.ShapeGeometry(shapeFrom(points))
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    pos.setZ(i, side * (halfWidthAt(y) + offset))
  }
  g.computeVertexNormals()
  return g
}

/** Thin slab from an xy outline, outer face at |z| = 1 + offset. */
function sideSlab(points, side, offset, thickness = 0.035) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(points), { depth: thickness, bevelEnabled: false })
  // extrude runs 0..+thickness in z; place it without mirroring (mirroring would flip the normals)
  g.translate(0, 0, side > 0 ? DIM.halfWidth + offset - thickness : -(DIM.halfWidth + offset))
  return flatten(g)
}

const BELT = DIM.belt
const DOOR_BOTTOM = 0.53

/**
 * Door definitions. Hinges sit on the leading edge (front-hinged, like the real truck).
 * Each door = lower slab + upper frame (on the tapered plane) + glass.
 */
export const DOORS = [
  {
    id: 'front',
    hingeX: 1.73,
    lower: [
      [1.73, DOOR_BOTTOM],
      [1.73, BELT],
      [-0.37, BELT],
      [-0.37, DOOR_BOTTOM],
    ],
    upper: [
      [1.73, BELT],
      [1.73, hoodY(1.73) - 0.03],
      [0.15, 1.745],
      [-0.37, roofY(-0.37) - 0.035],
      [-0.37, BELT],
    ],
    glass: [
      [1.6, 1.13],
      [0.25, 1.665],
      [-0.31, 1.585],
      [-0.31, 1.13],
    ],
  },
  {
    id: 'rear',
    hingeX: -0.41,
    lower: [
      [-0.41, DOOR_BOTTOM],
      [-0.41, BELT],
      [-1.12, BELT],
      [-1.12, DOOR_BOTTOM],
    ],
    upper: [
      [-0.41, BELT],
      [-0.41, roofY(-0.41) - 0.035],
      [-1.12, roofY(-1.12) - 0.035],
      [-1.12, BELT],
    ],
    glass: [
      [-0.46, 1.13],
      [-0.46, roofY(-0.46) - 0.09],
      [-1.06, roofY(-1.06) - 0.09],
      [-1.06, 1.13],
    ],
  },
]

/** Geometries for one door, already translated so the hinge is the origin. */
export function buildDoor(def, side) {
  const hinge = new THREE.Vector3(def.hingeX, 0, side * DIM.halfWidth)
  const parts = {
    lower: sideSlab(def.lower, side, 0.006),
    upper: sidePolygon(def.upper, side, 0.007),
    glass: sidePolygon(def.glass, side, 0.0095),
    // dark opening revealed when the door swings out
    holeLower: sidePolygon(def.lower, side, 0.0025),
    holeUpper: sidePolygon(def.upper, side, 0.003),
  }
  for (const k of ['lower', 'upper', 'glass']) parts[k].translate(-hinge.x, 0, -hinge.z)
  return { ...parts, hinge }
}

/** Quad lying on a sloped wall, expressed in a local frame whose origin is `origin`. */
function slopeQuad(p1, p2, inset, offset, origin) {
  const d = new THREE.Vector2().subVectors(p2, p1).normalize()
  const n = new THREE.Vector2(-d.y, d.x)
  if (n.y < 0) n.negate()
  const o = n.clone().multiplyScalar(offset)
  const w1 = halfWidthAt(p1.y) - inset
  const w2 = halfWidthAt(p2.y) - inset
  const v = [
    [p1.x + o.x, p1.y + o.y, -w1],
    [p1.x + o.x, p1.y + o.y, w1],
    [p2.x + o.x, p2.y + o.y, w2],
    [p2.x + o.x, p2.y + o.y, -w2],
  ].map(([x, y, z]) => [x - origin.x, y - origin.y, z])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3))
  g.setIndex([0, 1, 2, 0, 2, 3])
  g.computeVertexNormals()
  return g
}

/** Frunk lid: from the light bar up to the windshield base. Hinged at the top edge. */
export function buildFrunk() {
  const beltPt = new THREE.Vector2(hoodX(DIM.belt), DIM.belt)
  const top = new THREE.Vector2().lerpVectors(beltPt, DIM.apex, 0.31)
  const front = new THREE.Vector2(DIM.tip.x - 0.03, DIM.tip.y + 0.01)
  return {
    hinge: top,
    lid: slopeQuad(front, top, 0.03, 0.009, top),
    hole: slopeQuad(front, top, 0.05, 0.004, new THREE.Vector2(0, 0)),
  }
}

/** Tonneau (vault cover): retracts toward the tailgate. Local origin at the tail end. */
export function buildTonneau() {
  const start = new THREE.Vector2().lerpVectors(DIM.apex, DIM.tail, 0.36)
  const end = new THREE.Vector2().lerpVectors(DIM.apex, DIM.tail, 0.985)
  const angle = Math.atan2(start.y - end.y, start.x - end.x) // points from tail toward cab
  const lid = slopeQuad(start, end, 0.06, 0.009, end)
  // rotate into a frame where +x runs from the tail toward the cab
  lid.rotateZ(-angle)
  return {
    origin: end,
    angle,
    lid,
    hole: slopeQuad(start, end, 0.075, 0.004, new THREE.Vector2(0, 0)),
    length: start.distanceTo(end),
  }
}

/** Spur gear outline, extruded. */
export function buildGear(teeth = 24, rOuter = 0.2, depth = 0.04, bore = 0.04) {
  const s = new THREE.Shape()
  const rRoot = rOuter * 0.86
  const steps = teeth * 4
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = i % 4 === 1 || i % 4 === 2 ? rOuter : rRoot
    const p = [Math.cos(a) * r, Math.sin(a) * r]
    i === 0 ? s.moveTo(...p) : s.lineTo(...p)
  }
  const hole = new THREE.Path()
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true)
  s.holes.push(hole)
  // lightening holes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const h = new THREE.Path()
    h.absarc(Math.cos(a) * rRoot * 0.55, Math.sin(a) * rRoot * 0.55, rRoot * 0.16, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 })
  g.translate(0, 0, -depth / 2)
  return g
}

/** Drilled / slotted brake disc texture. */
export function createDiscTexture(size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#9a9ea3'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#2a2b2e'
  const cx = size / 2
  for (let ring = 0; ring < 3; ring++) {
    const r = size * (0.3 + ring * 0.06)
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + ring * 0.09
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, size * 0.008, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.fillStyle = '#3a3c40'
  ctx.beginPath()
  ctx.arc(cx, cx, size * 0.2, 0, Math.PI * 2)
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
