/**
 * Single source of truth for every number on the site (specs explorer,
 * overview stats, callout cards, range estimator, search index).
 *
 * Values are stored once, in US units, per trim. `formatSpec()` converts to
 * metric on demand. Figures are publicly quoted approximations, shown for
 * illustration only — the UI says so wherever they appear.
 */

export const TRIMS = [
  { id: 'awd', name: 'AWD', motors: 2 },
  { id: 'beast', name: 'Cyberbeast', motors: 3 },
]

export const SPEC_CATEGORIES = ['performance', 'range', 'capability', 'dimensions']

/** kind → how the value is converted and printed. */
const KINDS = {
  power: { us: (v) => [v, 'hp'], metric: (v) => [v * 0.7457, 'kW'] },
  time: { us: (v) => [v, 's'], metric: (v) => [v * 1.04, 's'], decimals: 1 },
  speed: { us: (v) => [v, 'mph'], metric: (v) => [v * 1.609, 'km/h'] },
  distance: { us: (v) => [v, 'mi'], metric: (v) => [v * 1.609, 'km'] },
  mass: { us: (v) => [v, 'lb'], metric: (v) => [v * 0.4536, 'kg'] },
  inches: { us: (v) => [v, 'in'], metric: (v) => [v * 2.54, 'cm'] },
  feet: { us: (v) => [v, 'ft'], metric: (v) => [v * 0.3048, 'm'], decimals: 1 },
  volume: { us: (v) => [v, 'cu ft'], metric: (v) => [v * 28.317, 'L'] },
  kw: { us: (v) => [v, 'kW'], metric: (v) => [v, 'kW'] },
  count: { us: (v) => [v, ''], metric: (v) => [v, ''] },
}

/**
 * id: i18n key under `specs.labels` · cat: filter category · kind: unit type
 * v: value per trim · tip: optional i18n key under `specs.tips`
 */
export const SPECS = [
  { id: 'power', cat: 'performance', kind: 'power', v: { awd: 600, beast: 845 } },
  { id: 'accel', cat: 'performance', kind: 'time', v: { awd: 4.1, beast: 2.6 }, tip: 'accel' },
  { id: 'topSpeed', cat: 'performance', kind: 'speed', v: { awd: 112, beast: 130 } },
  { id: 'motors', cat: 'performance', kind: 'count', v: { awd: 2, beast: 3 }, tip: 'motors' },
  { id: 'range', cat: 'range', kind: 'distance', v: { awd: 325, beast: 320 }, tip: 'range' },
  { id: 'charging', cat: 'range', kind: 'kw', v: { awd: 250, beast: 250 }, tip: 'charging' },
  { id: 'added15', cat: 'range', kind: 'distance', v: { awd: 136, beast: 128 } },
  { id: 'towing', cat: 'capability', kind: 'mass', v: { awd: 11000, beast: 11000 } },
  { id: 'payload', cat: 'capability', kind: 'mass', v: { awd: 2500, beast: 2500 } },
  { id: 'clearance', cat: 'capability', kind: 'inches', v: { awd: 17, beast: 17 }, tip: 'clearance' },
  { id: 'wading', cat: 'capability', kind: 'inches', v: { awd: 32, beast: 32 } },
  { id: 'storage', cat: 'capability', kind: 'volume', v: { awd: 121, beast: 121 } },
  { id: 'frunk', cat: 'capability', kind: 'volume', v: { awd: 7.1, beast: 7.1 } },
  { id: 'bed', cat: 'capability', kind: 'feet', v: { awd: 6, beast: 6 } },
  { id: 'length', cat: 'dimensions', kind: 'inches', v: { awd: 223.7, beast: 223.7 } },
  { id: 'height', cat: 'dimensions', kind: 'inches', v: { awd: 70.5, beast: 70.5 } },
  { id: 'weight', cat: 'dimensions', kind: 'mass', v: { awd: 6603, beast: 6843 } },
  { id: 'seats', cat: 'dimensions', kind: 'count', v: { awd: 5, beast: 5 } },
]

export const specById = Object.fromEntries(SPECS.map((s) => [s.id, s]))

/** i18n key for a spec label — 0–60 mph becomes 0–100 km/h in metric. */
export const specKey = (id, units = 'us') => `specs.labels.${id}${id === 'accel' && units === 'metric' ? 'Metric' : ''}`

const nf = {}
export function formatNumber(n, lang = 'en', decimals = 0) {
  const k = `${lang}${decimals}`
  nf[k] ??= new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return nf[k].format(n)
}

/** Convert + format a raw US value of a given kind. Returns { num, unit, text }. */
export function formatValue(kind, value, units = 'us', lang = 'en') {
  const k = KINDS[kind]
  const [n, unit] = k[units === 'metric' ? 'metric' : 'us'](value)
  const decimals = k.decimals ?? (Number.isInteger(value) && n > 20 ? 0 : n < 20 && !Number.isInteger(n) ? 1 : 0)
  const num = formatNumber(n, lang, decimals)
  return { n, num, unit, text: unit ? `${num} ${unit}` : num }
}

export function formatSpec(id, trim = 'beast', units = 'us', lang = 'en') {
  const s = specById[id]
  return formatValue(s.kind, s.v[trim], units, lang)
}

/* ------------------------------------------------------------------ */
/* Range estimator model (illustrative)                                */
/* ------------------------------------------------------------------ */
export const USABLE_KWH = 123 // assumed usable pack capacity
export const LOADS = [
  { id: 'empty', factor: 1 },
  { id: 'payload', factor: 0.93 },
  { id: 'tow5k', factor: 0.62 },
  { id: 'tow10k', factor: 0.47 },
]

/**
 * Rough, transparent estimate: rated range scaled by speed, temperature,
 * load and aero covers. Speed in mph, temperature in °C.
 */
export function estimateRange({ trim, speed, tempC, load, covers }) {
  const base = specById.range.v[trim]
  const fSpeed = Math.min(1.15, Math.max(0.55, 1 - 0.0115 * (speed - 60)))
  let fTemp = 1
  if (tempC < 20) fTemp = 1 - 0.0085 * (20 - tempC)
  else if (tempC > 30) fTemp = 1 - 0.006 * (tempC - 30)
  const fLoad = LOADS.find((l) => l.id === load)?.factor ?? 1
  const fCovers = covers ? 1 : 0.955
  const miles = Math.max(40, base * fSpeed * fTemp * fLoad * fCovers)
  const whPerMile = (USABLE_KWH * 1000) / miles
  // 10 → 80 % at an average ~165 kW (slower in the cold)
  const avgKw = 165 * (tempC < 5 ? 0.75 : 1)
  const chargeMin = ((USABLE_KWH * 0.7) / avgKw) * 60
  return { miles, whPerMile, chargeMin, ratio: miles / base, factors: { fSpeed, fTemp, fLoad, fCovers } }
}
