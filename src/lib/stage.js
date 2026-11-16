/**
 * The Anatomy sequence — a scroll-scrubbed film that mirrors the reference:
 * dark reveal → lights up → turntable to profile → callouts → doors & frunk →
 * exploded skateboard → "Wheels" wipe → wheel close-up → drive unit →
 * fly-through → vault close-up → pull back.
 *
 * `stage` is a plain mutable object. GSAP tweens it; the R3F scene reads it
 * every frame. Nothing here causes React re-renders.
 */
export const SETS = {
  main: [0, 0, 0],
  wheel: [0, 0, -60],
  drive: [0, 0, 60],
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const W = (p) => add(p, SETS.wheel)
const D = (p) => add(p, SETS.drive)

const PI = Math.PI

/** Values every shot may set. Missing keys inherit from the previous shot. */
export const BASE = {
  cam: [0, 1.15, 10.6],
  look: [0, 0.95, 0],
  fov: 30,
  rotY: -PI / 2,
  explode: 0,
  doors: 0,
  frunk: 0,
  tonneau: 0,
  cover: 0,
  outline: 0,
  wheelSpin: 0,
  gears: 0,
}

/**
 * Each shot = one scroll "page". `wipe` = the dark diagonal panel with a
 * scrambled word that hides a hard cut to another set (exactly as the reference
 * does before its wheel close-up).
 */
export const SHOTS = [
  { id: 'front' },
  { id: 'quarter', rotY: -2.25, cam: [0, 1.55, 11.2], outline: 1 },
  { id: 'profile', rotY: -PI, cam: [0, 1.2, 11.8], look: [0, 0.9, 0], outline: 1 },
  { id: 'exo', rotY: -PI - 0.06, cam: [0.4, 1.3, 11.2], outline: 0, card: 'exo' },
  { id: 'open', rotY: -3.78, cam: [0, 1.75, 10.8], doors: 1, frunk: 1, card: 'frunk' },
  { id: 'explode', rotY: -4.12, cam: [0, 2.8, 12.8], look: [0, 1.25, 0], explode: 1, doors: 0.7, card: 'power' },
  {
    id: 'wheel-in',
    wipe: 'wheels',
    cam: W([1.9, 0.8, 2.6]),
    look: W([0, 0.45, 0]),
    fov: 32,
    explode: 0,
    doors: 0,
    frunk: 0,
    wheelSpin: 0.6,
  },
  { id: 'wheel', cam: W([-0.5, 0.62, 1.95]), look: W([0.05, 0.45, 0]), cover: 1, wheelSpin: 2.2, card: 'wheel' },
  { id: 'drive', wipe: 'drive', cam: D([2.8, 1.5, 3.9]), look: D([0, 0.5, 0]), fov: 30, cover: 0, card: 'suspension', gears: 1 },
  { id: 'rotor', cam: D([0.75, 0.62, 0.95]), look: D([0.1, 0.45, 0.25]), fov: 38, card: 'motor', gears: 3 },
  {
    id: 'vault',
    wipe: 'vault',
    cam: [2.4, 3.3, 5.4],
    look: [0.85, 1.25, 1.4],
    fov: 30,
    rotY: -4.21,
    tonneau: 1,
    card: 'vault',
  },
  { id: 'outro', cam: [0.4, 1.7, 11.6], look: [0, 0.95, 0], rotY: -3.9, doors: 1, frunk: 1, tonneau: 0.4 },
]

/** Resolve inheritance so every shot is a complete state. */
export const RESOLVED = (() => {
  let prev = { ...BASE }
  return SHOTS.map((s) => {
    const next = { ...prev, ...s }
    prev = next
    return next
  })
})()

/** Live state (starts at the dark intro framing). */
export const stage = {
  camX: 0,
  camY: 0.95,
  camZ: 9.2,
  lookX: 0,
  lookY: 0.9,
  lookZ: 0,
  fov: 30,
  rotY: -PI / 2,
  explode: 0,
  doors: 0,
  frunk: 0,
  tonneau: 0,
  cover: 0,
  outline: 0,
  wheelSpin: 0,
  gears: 0,
  studio: 0, // 0 = dark garage, 1 = white studio
  lights: 0, // light bar
  beams: 0, // volumetric beams
  anchor: -1, // index into CARDS for the leader line, -1 = none
}

export const toStage = (s) => ({
  camX: s.cam[0],
  camY: s.cam[1],
  camZ: s.cam[2],
  lookX: s.look[0],
  lookY: s.look[1],
  lookZ: s.look[2],
  fov: s.fov,
  rotY: s.rotY,
  explode: s.explode,
  doors: s.doors,
  frunk: s.frunk,
  tonneau: s.tonneau,
  cover: s.cover,
  outline: s.outline,
  wheelSpin: s.wheelSpin,
  gears: s.gears,
})

/**
 * Callout cards (the dark spec panels in the reference).
 * Copy lives in i18n under `cards.<id>.*`; numbers come from the spec registry
 * so they follow the units preference.
 *   stat:  { literal } | { spec }          big figure (with `unitKey` for literals)
 *   rows:  [labelKey, value, bar?]  where value = { t: key } | { spec: id } | { kind, value }
 *   anchor: point on the truck (local coords) for the leader line
 */
export const CARDS = {
  exo: {
    pos: 'tl',
    stat: { literal: '30X', unitKey: 'cards.exo.unit' },
    rows: [
      ['cards.exo.material', { t: 'cards.exo.materialV' }, 0.92],
      ['cards.exo.finish', { t: 'cards.exo.finishV' }, 0.7],
      ['cards.exo.panels', { t: 'cards.exo.panelsV' }, 0.55],
    ],
    anchor: [0.15, 1.78, 0],
  },
  frunk: {
    pos: 'tl',
    stat: { spec: 'storage' },
    rows: [
      ['cards.frunk.frunk', { spec: 'frunk' }, 0.3],
      ['cards.frunk.vault', { kind: 'volume', value: 67 }, 0.75],
      ['cards.frunk.total', { spec: 'storage' }, 1],
    ],
    anchor: [2.3, 1.12, 0.35],
  },
  power: {
    pos: 'tl',
    stat: { spec: 'power' },
    rows: [
      ['specs.labels.accel', { spec: 'accel', metricLabel: 'specs.labels.accelMetric' }, 0.95],
      ['cards.power.top', { spec: 'topSpeed' }, 0.7],
      ['cards.power.range', { spec: 'range' }, 0.8],
    ],
    anchor: [-1.9, 0.62, -0.22],
  },
  wheel: {
    pos: 'l',
    number: '08',
    rows: [
      ['cards.wheel.tyre', { t: 'cards.wheel.tyreV' }],
      ['cards.wheel.rim', { t: 'cards.wheel.rimV' }],
      ['cards.wheel.brakes', { t: 'cards.wheel.brakesV' }],
    ],
  },
  suspension: {
    pos: 'r',
    number: '09',
    rows: [
      ['cards.suspension.front', { t: 'cards.suspension.frontV' }],
      ['cards.suspension.spring', { t: 'cards.suspension.springV' }],
      ['cards.suspension.clearance', { spec: 'clearance' }],
    ],
  },
  motor: {
    pos: 'l',
    number: '11',
    rows: [
      ['cards.motor.motors', { t: 'cards.motor.motorsV' }],
      ['cards.motor.layout', { t: 'cards.motor.layoutV' }],
      ['cards.motor.steering', { t: 'cards.motor.steeringV' }],
    ],
  },
  vault: {
    pos: 'r',
    number: '12',
    rows: [
      ['cards.vault.bed', { spec: 'bed' }],
      ['cards.vault.payload', { spec: 'payload' }],
      ['cards.vault.towing', { spec: 'towing' }],
    ],
  },
}

export const CARD_IDS = Object.keys(CARDS)
export const TOTAL_CHAPTERS = 12
