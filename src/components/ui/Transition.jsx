import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { reducedMotion } from '../../lib/interaction'

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger)

const el = { root: null, label: null }
let busy = false

/**
 * Cinematic in-page navigation: a curtain sweeps up, the page jumps underneath,
 * the curtain lifts away. Falls back to a smooth scroll for short hops and for
 * reduced-motion users. `then` runs once the destination is on screen.
 */
export function goToY(y, label = '', then) {
  if (busy) return
  const near = Math.abs(y - window.scrollY) < window.innerHeight * 1.2
  if (reducedMotion() || near || !el.root) {
    gsap.to(window, {
      duration: reducedMotion() ? 0 : 1.2,
      ease: 'power3.inOut',
      scrollTo: { y, autoKill: true },
      onComplete: () => then?.(),
    })
    return
  }
  busy = true
  el.label.textContent = label
  const chars = el.label
  gsap
    .timeline({
      onComplete: () => {
        busy = false
        then?.()
      },
    })
    .set(el.root, { visibility: 'visible' })
    .fromTo(el.root, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.65, ease: 'expo.inOut' })
    .fromTo(chars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, '-=0.25')
    .add(() => {
      window.scrollTo(0, y)
      ScrollTrigger.update()
    })
    .to(chars, { yPercent: -110, opacity: 0, duration: 0.45, ease: 'expo.in' }, '+=0.25')
    .to(el.root, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: 'expo.inOut' }, '-=0.15')
    .set(el.root, { visibility: 'hidden' })
}

export function goTo(id, label, then) {
  const target = document.getElementById(id)
  if (!target) return
  goToY(target.getBoundingClientRect().top + window.scrollY, label || target.dataset.title || '', then)
}

export default function Transition() {
  const root = useRef()
  return (
    <div
      className="curtain"
      ref={(n) => {
        root.current = n
        el.root = n
      }}
      aria-hidden="true"
    >
      <span className="curtain__mask">
        <span className="curtain__label" ref={(n) => (el.label = n)} />
      </span>
    </div>
  )
}
