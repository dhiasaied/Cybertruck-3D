import { useEffect } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useFinish, usePalette } from '../store/useExperience'
import { getMaterials } from '../lib/materials'

/** Pushes the accent palette into CSS custom properties. */
export function useThemeVars() {
  const p = usePalette()
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', p.accent)
    root.setProperty('--on-accent', p.onAccent)
    root.setProperty('--dark', p.dark)
  }, [p])
}

/** Morphs the shared body material (every truck on the page) to the chosen finish. */
export function useFinishMorph() {
  const f = useFinish()
  useEffect(() => {
    const m = getMaterials()
    const c = new THREE.Color(f.color)
    const mats = [m.body, m.bodyDouble]
    mats.forEach((mat) => {
      mat.roughnessMap = f.brushed ? m.brushed : null
      mat.needsUpdate = true
    })
    const tl = gsap.timeline({ defaults: { duration: 0.9, ease: 'power2.inOut' } })
    mats.forEach((mat) => {
      tl.to(mat.color, { r: c.r, g: c.g, b: c.b }, 0)
      tl.to(mat, { metalness: f.metalness, roughness: f.roughness, clearcoat: f.clearcoat }, 0)
    })
    return () => tl.kill()
  }, [f])
}
