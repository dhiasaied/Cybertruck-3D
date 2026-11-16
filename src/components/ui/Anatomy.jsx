import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { View } from '@react-three/drei'
import MainStage from '../three/MainStage'
import SplitText from './SplitText'
import { CARDS, RESOLVED, SHOTS, TOTAL_CHAPTERS, stage, toStage } from '../../lib/stage'
import { overlay } from '../../lib/overlay'
import { spin, reducedMotion } from '../../lib/interaction'
import { useExperience } from '../../store/useExperience'
import { tNow as tr, useT } from '../../lib/i18n'
import { formatSpec, formatValue } from '../../lib/specs'

gsap.registerPlugin(ScrollTrigger)

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const HOLD = 0.5 // extra scroll at the end of the sequence (in "pages")

/* ------------------------------------------------------------------ */
/* Callout card                                                         */
/* ------------------------------------------------------------------ */
function Callout({ id, card }) {
  const t = useT()
  const lang = useExperience((s) => s.lang)
  const units = useExperience((s) => s.units)
  const value = (v) => {
    if (v.t) return t(v.t)
    if (v.spec) return formatSpec(v.spec, 'beast', units, lang).text
    return formatValue(v.kind, v.value, units, lang).text
  }
  let stat = null
  if (card.stat?.literal) stat = { n: card.stat.literal, unit: t(card.stat.unitKey) }
  else if (card.stat?.spec) {
    const v = formatSpec(card.stat.spec, 'beast', units, lang)
    stat = { n: v.num, unit: v.unit }
  }
  return (
    <aside
      className={`callout callout--${card.pos} ${stat ? 'callout--stat' : ''}`}
      ref={(el) => (overlay.cards[id] = el)}
      aria-hidden="true"
    >
      <div className="callout__eyebrow">
        <span>— {t(`cards.${id}.eyebrow`)}</span>
        {card.number && <em>{card.number}</em>}
      </div>
      {stat ? (
        <div className="callout__stat">
          {stat.n}
          <small>{stat.unit}</small>
        </div>
      ) : (
        <h3 className="callout__title">{t(`cards.${id}.title`)}</h3>
      )}
      <p className="callout__text">{t(`cards.${id}.text`)}</p>
      <ul className="callout__rows">
        {card.rows.map(([labelKey, v, bar]) => (
          <li key={labelKey}>
            <span>{t(units === 'metric' && v.metricLabel ? v.metricLabel : labelKey)}</span>
            {bar !== undefined && (
              <i className="callout__bar">
                <b data-v={bar} />
              </i>
            )}
            <strong>{value(v)}</strong>
          </li>
        ))}
      </ul>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Drag / swipe to rotate the hero truck (horizontal only; vertical     */
/* gestures keep scrolling the page on touch screens).                  */
/* ------------------------------------------------------------------ */
function useDragSpin(ref) {
  useEffect(() => {
    const el = ref.current
    let lastX = 0
    let lastT = 0
    let id = null
    const down = (e) => {
      if (e.target.closest('button, a, .callout')) return
      id = e.pointerId
      spin.dragging = true
      spin.vel = 0
      lastX = e.clientX
      lastT = performance.now()
      el.classList.add('is-dragging')
    }
    const move = (e) => {
      if (!spin.dragging || e.pointerId !== id) return
      const now = performance.now()
      const dx = e.clientX - lastX
      const dtS = Math.max(0.001, (now - lastT) / 1000)
      const k = 0.0065
      spin.yaw = Math.max(-Math.PI, Math.min(Math.PI, spin.yaw + dx * k))
      spin.vel = (dx * k) / dtS
      lastX = e.clientX
      lastT = now
    }
    const up = (e) => {
      if (e.pointerId !== id) return
      spin.dragging = false
      spin.vel = Math.max(-6, Math.min(6, spin.vel))
      id = null
      el.classList.remove('is-dragging')
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [ref])
}

/* ------------------------------------------------------------------ */
/* Anatomy: sticky stage + scroll-scrubbed teardown film               */
/* ------------------------------------------------------------------ */
export default function Anatomy() {
  const section = useRef()
  const sticky = useRef()
  const wipe = useRef()
  const wipeWord = useRef()
  const chapterNum = useRef()
  const chapterName = useRef()
  const chapterBar = useRef()
  const chapterIdx = useRef(0)
  const hero = useRef()
  const t = useT()
  const lang = useExperience((s) => s.lang)
  const units = useExperience((s) => s.units)
  const power = formatSpec('power', 'beast', units, lang)
  const accel = formatSpec('accel', 'beast', units, lang)
  const range = formatSpec('range', 'beast', units, lang)
  const accelShort = units === 'metric' ? '0–100' : '0–60'

  // keep the chapter label in the current language
  useEffect(() => {
    if (chapterName.current) chapterName.current.textContent = tr(`chapters.${SHOTS[chapterIdx.current].id}`)
  }, [lang])
  const ready = useExperience((s) => s.ready)
  const introDone = useExperience((s) => s.introDone)
  const setIntroDone = useExperience((s) => s.setIntroDone)

  useEffect(() => {
    overlay.stageEl = sticky.current
  }, [])
  useDragSpin(sticky)

  // ---------------- intro: lights on in the dark, then the studio fades up
  useEffect(() => {
    if (!ready) return
    document.documentElement.classList.add('is-locked')
    window.scrollTo(0, 0)
    const target = toStage(RESOLVED[0])
    if (reducedMotion()) {
      Object.assign(stage, target, { studio: 1, lights: 1, beams: 0 })
      setIntroDone()
      return
    }
    const tl = gsap.timeline({ delay: 0.5, onComplete: setIntroDone })
    tl.to(stage, { lights: 1, duration: 0.07 })
      .to(stage, { lights: 0.1, duration: 0.09 })
      .to(stage, { lights: 1, beams: 1, duration: 0.6, ease: 'power2.out' })
      .to(stage, { camZ: 8.6, duration: 1.6, ease: 'none' }, '<')
      .to(stage, { studio: 1, beams: 0, duration: 2.2, ease: 'power2.inOut' }, '+=0.2')
      .to(stage, { ...target, duration: 2.4, ease: 'power3.inOut' }, '<')
    const safety = setTimeout(() => {
      tl.progress(1)
      setIntroDone()
    }, 9000)
    return () => {
      clearTimeout(safety)
      tl.kill()
    }
  }, [ready, setIntroDone])

  // ---------------- hero copy + scroll cue entrance
  useLayoutEffect(() => {
    if (!introDone) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.hero__eyebrow', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 })
        .fromTo('.hero__title .split__char', { yPercent: 115, y: 0 }, { yPercent: 0, y: 0, duration: 1.3, stagger: 0.022 }, '-=0.7')
        .fromTo('.hero__meta > *', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, '-=0.9')
        .fromTo('.cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, '-=0.6')
        .fromTo('.chapter', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, '<')
    }, sticky)
    return () => ctx.revert()
  }, [introDone])

  // ---------------- scroll film
  useLayoutEffect(() => {
    if (!introDone) return
    document.documentElement.classList.remove('is-locked')
    const n = SHOTS.length
    const wipeEl = wipe.current
    const wordEl = wipeWord.current

    const renderWipe = (p, word) => {
      // cover: left edge sweeps in from the right; reveal: right edge sweeps out to the left
      const L = p < 0.5 ? 115 - 250 * p : -10
      const R = p < 0.5 ? 125 : 125 - 270 * (p - 0.5)
      wipeEl.style.clipPath = `polygon(${L + 14}% 0, ${R + 14}% 0, ${R}% 100%, ${L}% 100%)`
      wipeEl.style.visibility = p > 0.001 && p < 0.999 ? 'visible' : 'hidden'
      const settle = Math.min(1, Math.max(0, (p - 0.18) / 0.3))
      const fade = 1 - Math.min(1, Math.abs(p - 0.5) / 0.32)
      word = tr(`wipes.${word}`)
      const count = Math.floor(settle * word.length)
      let out = ''
      for (let i = 0; i < word.length; i++) {
        out += i < count || word[i] === ' ' ? word[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      wordEl.textContent = out
      wordEl.style.opacity = fade
      wordEl.style.transform = `translateX(${(0.5 - p) * 30}vw)`
    }

    let lastIdx = -1
    const setChapter = (idx) => {
      if (idx === lastIdx) return
      const name = tr(`chapters.${SHOTS[idx].id}`)
      const changedName = lastIdx < 0 || tr(`chapters.${SHOTS[lastIdx].id}`) !== name
      chapterIdx.current = idx
      lastIdx = idx
      if (chapterNum.current) chapterNum.current.textContent = `${String(idx + 1).padStart(2, '0')}/${TOTAL_CHAPTERS}`
      if (changedName && chapterName.current) {
        gsap.fromTo(
          chapterName.current,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', onStart: () => (chapterName.current.textContent = name) },
        )
      }
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            const pos = self.progress * (n - 1 + HOLD)
            setChapter(Math.min(n - 1, Math.round(pos)))
            if (chapterBar.current) chapterBar.current.style.transform = `scaleX(${self.progress})`
          },
        },
      })
      setChapter(0)

      for (let i = 1; i < n; i++) {
        const from = toStage(RESOLVED[i - 1])
        const to = toStage(RESOLVED[i])
        const shot = SHOTS[i]
        if (shot.wipe) {
          const proxy = { p: 0 }
          const word = shot.wipe
          tl.fromTo(
            proxy,
            { p: 0 },
            { p: 1, duration: 1, ease: 'none', immediateRender: false, onUpdate: () => renderWipe(proxy.p, word) },
            i - 1,
          )
          tl.fromTo(stage, from, { ...from, duration: 0.5, immediateRender: false }, i - 1)
          tl.set(stage, to, i - 0.5)
        } else {
          tl.fromTo(stage, from, { ...to, duration: 1, immediateRender: false }, i - 1)
        }
      }
      tl.to({}, { duration: HOLD }, n - 1)

      // hero copy drifts up and away as the film starts
      tl.fromTo('.hero', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -60, duration: 0.45, ease: 'power2.in', immediateRender: false }, 0)

      // callout cards: slide in, rows stagger, bars fill — then exit before the next shot
      SHOTS.forEach((s, i) => {
        if (!s.card) return
        const el = overlay.cards[s.card]
        const pos = CARDS[s.card].pos
        const dx = pos === 'r' ? 30 : -30
        const rows = el.querySelectorAll('.callout__rows li')
        const bars = el.querySelectorAll('.callout__bar b')
        tl.fromTo(
          el,
          { autoAlpha: 0, x: dx, clipPath: 'inset(0 0 100% 0)' },
          { autoAlpha: 1, x: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.3, ease: 'power3.out', immediateRender: false },
          i - 0.35,
        )
        tl.fromTo(rows, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.18, stagger: 0.04, immediateRender: false }, i - 0.2)
        if (bars.length)
          tl.fromTo(
            bars,
            { scaleX: 0 },
            { scaleX: (k, b) => parseFloat(b.dataset.v), duration: 0.25, stagger: 0.05, ease: 'power2.out', immediateRender: false },
            i - 0.15,
          )
        if (i < n - 1) tl.to(el, { autoAlpha: 0, x: -dx * 0.5, duration: 0.22, ease: 'power2.in' }, i + 0.45)
      })
    }, section)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [introDone])

  return (
    <section
      id="anatomy"
      data-title={t('nav.anatomy')}
      className="anatomy"
      ref={section}
      style={{ height: `${(SHOTS.length - 1 + HOLD) * 100 + 100}vh` }}
    >
      <div className="anatomy__sticky" ref={sticky} data-cursor={t('cursor.drag')}>
        <View className="anatomy__view">
          <MainStage />
        </View>

        <svg className="leader" aria-hidden="true">
          <path ref={(el) => (overlay.linePath = el)} />
          <circle ref={(el) => (overlay.lineDot = el)} r="3.5" />
        </svg>

        {/* opening-shot copy */}
        <div className="hero" ref={hero}>
          <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
          <SplitText as="h1" className="hero__title" text={t('hero.title')} key={`h1-${lang}`} />
          <p className="sr-only">{t('hero.intro')}</p>
          <div className="hero__meta">
            <span>
              <b>{power.num}</b> {power.unit}
            </span>
            <span>
              <b>{accel.num}</b> {accel.unit} {accelShort}
            </span>
            <span>
              <b>{range.num}</b> {range.unit} {t('hero.range')}
            </span>
          </div>
          <div className="cue" aria-hidden="true">
            <i />
            <span>{t('hero.cue')}</span>
          </div>
        </div>

        {Object.entries(CARDS).map(([id, card]) => (
          <Callout key={id} id={id} card={card} />
        ))}

        <div className="wipe" ref={wipe} aria-hidden="true">
          <span className="wipe__word" ref={wipeWord} />
        </div>

        <div className="chapter" aria-hidden="true">
          <span className="chapter__name-mask">
            <span className="chapter__name" ref={chapterName}>
              {tr('chapters.front')}
            </span>
          </span>
          <i>
            <b ref={chapterBar} />
          </i>
          <span ref={chapterNum}>01/{TOTAL_CHAPTERS}</span>
        </div>
      </div>
    </section>
  )
}
