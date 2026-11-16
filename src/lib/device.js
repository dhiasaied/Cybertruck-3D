/** Cheap heuristics to pick a starting graphics tier. */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window
}

export function detectInitialQuality() {
  if (typeof window === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  if (window.innerWidth < 768 || cores <= 4 || mem <= 2) return 'low'
  if (isTouchDevice()) return 'medium'
  return 'high'
}

export const QUALITY = {
  low: { dpr: [1, 1.25] },
  medium: { dpr: [1, 1.5] },
  high: { dpr: [1, 2] },
}
