/**
 * Shared, render-free interaction state read by both the DOM layer and the
 * WebGL loop (plain mutable objects — no React re-renders per frame).
 */

/** Normalised pointer position (-1..1), updated by the global cursor listener. */
export const pointer = { x: 0, y: 0 }

/** Hero-stage drag-to-rotate state (yaw offset added on top of the scroll pose). */
export const spin = { yaw: 0, vel: 0, dragging: false }

export const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
