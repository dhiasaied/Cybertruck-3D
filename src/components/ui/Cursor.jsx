import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { canHover, pointer, reducedMotion } from '../../lib/interaction'

/**
 * Global pointer layer:
 *  - feeds the normalised `pointer` used for 3D parallax (all devices)
 *  - custom dot + lagging ring cursor with contextual labels (`data-cursor`)
 *  - magnetic pull on any `[data-magnetic]` element
 * Cursor + magnetism only on fine pointers without reduced motion; touch
 * devices keep their native interaction.
 */
export default function Cursor() {
  const dot = useRef()
  const ring = useRef()
  const label = useRef()
  const [enabled] = useState(() => canHover() && !reducedMotion())

  useEffect(() => {
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' })
    let magnet = null
    let mode = ''

    const setMode = (next, text = '') => {
      if (next === mode && label.current.textContent === text) return
      mode = next
      ring.current.dataset.mode = next
      label.current.textContent = text
    }

    const release = (el) => {
      if (!el) return
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
      const inner = el.querySelector('[data-magnetic-inner]')
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    }

    const onMove = (e) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)

      const t = e.target instanceof Element ? e.target : null
      // contextual cursor
      const labelled = t?.closest('[data-cursor]')
      if (labelled) setMode('label', labelled.dataset.cursor)
      else if (t?.closest('a, button, label, input, [role="button"]')) setMode('hover')
      else setMode('')

      // magnetic elements
      const m = t?.closest('[data-magnetic]')
      if (m !== magnet) {
        release(magnet)
        magnet = m
      }
      if (m) {
        const r = m.getBoundingClientRect()
        const strength = parseFloat(m.dataset.magnetic) || 0.35
        const ox = (e.clientX - (r.left + r.width / 2)) * strength
        const oy = (e.clientY - (r.top + r.height / 2)) * strength
        gsap.to(m, { x: ox, y: oy, duration: 0.4, ease: 'power3.out' })
        const inner = m.querySelector('[data-magnetic-inner]')
        if (inner) gsap.to(inner, { x: ox * 0.4, y: oy * 0.4, duration: 0.4, ease: 'power3.out' })
      }
    }
    const onDown = () => ring.current.classList.add('is-down')
    const onUp = () => ring.current.classList.remove('is-down')
    const onLeave = () => gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 })
    const onEnter = () => gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 })

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span ref={label} />
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
