/** Site accent palettes (UI highlight colour, buttons, progress, links). */
export const PALETTES = [
  { id: 'graphite', name: 'Graphite', accent: '#111214', onAccent: '#ffffff', dark: '#16171a' },
  { id: 'signal', name: 'Signal', accent: '#e4401b', onAccent: '#ffffff', dark: '#17110f' },
  { id: 'arctic', name: 'Arctic', accent: '#2f6bff', onAccent: '#ffffff', dark: '#10131a' },
  { id: 'volt', name: 'Volt', accent: '#7fbf1f', onAccent: '#0b0c0d', dark: '#121510' },
  { id: 'sand', name: 'Sand', accent: '#b08a5a', onAccent: '#ffffff', dark: '#171513' },
]

/** Exterior finishes — values feed the shared MeshPhysicalMaterial. */
export const FINISHES = [
  { id: 'stainless', name: 'Stainless Steel', color: '#c3c7cc', metalness: 1, roughness: 0.32, clearcoat: 0.05, brushed: true },
  { id: 'satin-black', name: 'Satin Black', color: '#1d1e21', metalness: 0.6, roughness: 0.42, clearcoat: 0.4, brushed: false },
  { id: 'arctic', name: 'Arctic White', color: '#eceef0', metalness: 0.12, roughness: 0.3, clearcoat: 1, brushed: false },
  { id: 'cyber-red', name: 'Cyber Red', color: '#a3141b', metalness: 0.5, roughness: 0.26, clearcoat: 1, brushed: false },
  { id: 'electric', name: 'Electric Blue', color: '#1e4fd8', metalness: 0.5, roughness: 0.26, clearcoat: 1, brushed: false },
  { id: 'custom', name: 'Custom', color: '#9aa0a8', metalness: 0.6, roughness: 0.3, clearcoat: 0.8, brushed: false },
]
