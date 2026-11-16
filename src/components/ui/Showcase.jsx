import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ShowcaseView from '../three/ShowcaseView'
import SplitText from './SplitText'
import { RollText } from './Chrome'
import { goTo } from './Transition'
import { useExperience } from '../../store/useExperience'
import { canHover, reducedMotion } from '../../lib/interaction'
import { useT } from '../../lib/i18n'
import { formatSpec, formatNumber } from '../../lib/specs'
import { BookmarkButton } from './Overlays'
import { RangeEstimator, SpecsExplorer } from './Data'

gsap.registerPlugin(ScrollTrigger)
const PI = Math.PI

/* Camera presets for the "photographs" (truck at origin, nose = +x before rotY). */
const SHOT = {
  front: { rotY: -PI / 2, cam: [0, 1.2, 8.2], look: [0, 0.85, 0], fov: 27 },
  quarterDark: { rotY: -2.35, cam: [0.6, 1.5, 10.8], look: [0, 0.8, 0], fov: 30 },
  quarter: { rotY: -2.25, cam: [0, 1.45, 10.4], look: [0, 0.85, 0], fov: 30 },
  concept: { rotY: -2.3, cam: [0, 1.35, 11], look: [0, 0.85, 0], fov: 28 },
  exo: { rotY: 2.4, cam: [0, 2.3, 9.4], look: [0, 0.9, 0], fov: 30 },
  glass: { rotY: -PI / 2, cam: [2.6, 3.7, 6.2], look: [0, 1.4, 0.9], fov: 32 },
  wheels: { rotY: -PI, cam: [-0.5, 0.82, 3.7], look: [-1.85, 0.5, 0.8], fov: 34 },
  signature: { rotY: -PI / 2, cam: [0.9, 1.08, 6.3], look: [0, 0.93, 2.6], fov: 30 },
  power: { rotY: 2.5, cam: [1.6, 2.1, 7.6], look: [-0.3, 1.0, 0], fov: 32, pose: { tonneau: 0.5 } },
  tonneau: { rotY: PI / 2, cam: [1.7, 3.3, 6.8], look: [0, 1.2, 1.3], fov: 32, pose: { tonneau: 0.75 } },
  frunk: { rotY: -PI / 2 + 0.4, cam: [0, 2.6, 8.4], look: [0, 1.0, 1.3], fov: 30, pose: { frunk: 1 } },
  air: { rotY: 0, cam: [1.1, 0.55, 5.6], look: [1.6, 0.62, 0.8], fov: 32 },
  motors: { rotY: -PI, cam: [0.4, 1.0, 6.4], look: [-1.3, 0.75, 0.6], fov: 30 },
}

/**
 * A framed live render. The wrapper owns the hover state the 3D rig reads,
 * a glowing border, and a "shutter" that reveals the frame on scroll.
 */
function Shot({ id, className = '', dark = false, bg, label = 'rotate' }) {
  const t = useT()
  const s = SHOT[id]
  const hover = useRef({ active: false, x: 0, y: 0 })
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    hover.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
    hover.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  return (
    <div
      className={`frame ${className}`}
      data-cursor={t(`cursor.${label}`)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && (hover.current.active = true)}
      onPointerLeave={() => (hover.current.active = false)}
      onPointerMove={onMove}
    >
      <ShowcaseView
        className="frame__view"
        cam={s.cam}
        look={s.look}
        fov={s.fov}
        rotY={s.rotY}
        pose={s.pose}
        dark={dark}
        hover={hover}
        bg={bg ?? (dark ? '#2a2b2f' : '#e8e7e4')}
      />
      <i className="frame__shutter" aria-hidden="true" />
      <span className="frame__fallback" aria-hidden="true">
        {t('fallback3d')}
      </span>
    </div>
  )
}

/** Animated, locale- and unit-aware number. Owns its text node (no React children). */
function CountUp({ value, decimals = 0 }) {
  const ref = useRef()
  const lang = useExperience((s) => s.lang)
  const shown = useRef(null)
  useEffect(() => {
    const el = ref.current
    const o = { v: shown.current ?? 0 }
    const render = () => (el.textContent = formatNumber(o.v, lang, decimals))
    if (reducedMotion()) {
      o.v = value
      render()
      shown.current = value
      return
    }
    // first run waits for the element to scroll in; later runs (units/lang) tween immediately
    const tw = gsap.to(o, {
      v: value,
      duration: shown.current == null ? 1.8 : 0.7,
      ease: 'power2.out',
      onUpdate: render,
      onComplete: () => (shown.current = value),
      scrollTrigger: shown.current == null ? { trigger: el, start: 'top 92%' } : undefined,
    })
    render()
    return () => {
      shown.current = o.v
      tw.scrollTrigger?.kill()
      tw.kill()
    }
  }, [value, decimals, lang])
  return <b ref={ref} />
}

/* ------------------------------------------------------------------ */
function Overview() {
  const t = useT()
  const units = useExperience((s) => s.units)
  const lang = useExperience((s) => s.lang)
  const power = formatSpec('power', 'beast', units, lang)
  const powerAlt = formatSpec('power', 'beast', units === 'us' ? 'metric' : 'us', lang)
  const accel = formatSpec('accel', 'beast', units, lang)
  return (
    <section className="overview" id="overview" data-title={t('sections.overview')}>
      <div className="overview__grid">
        <header className="overview__head">
          <p className="eyebrow" data-reveal>
            {t('overview.eyebrow')}
          </p>
          <SplitText as="h2" className="reveal-chars" text="CYBERTRUCK" />
          <div className="overview__cols" data-reveal>
            <p>{t('overview.colA')}</p>
            <p>{t('overview.colB')}</p>
          </div>
          <div className="overview__stats" data-reveal>
            <div>
              <CountUp value={Math.round(powerAlt.n)} />
              <small>{powerAlt.unit}</small> / <CountUp value={Math.round(power.n)} />
              <small>{power.unit}</small>
            </div>
            <div>
              <CountUp value={accel.n} decimals={1} />
              <small>{t('overview.accelUnit', { unit: accel.unit, v: units === 'metric' ? '100 km/h' : '60 mph' })}</small>
            </div>
            <button className="link" onClick={() => goTo('technical', t('nav.technical'))}>
              <RollText>{t('overview.techLink')}</RollText>
            </button>
          </div>
        </header>

        <div className="overview__frame overview__frame--a" data-speed="-0.04">
          <Shot id="front" />
        </div>
        <div className="overview__frame overview__frame--b" data-speed="0.03">
          <Shot id="quarterDark" dark />
        </div>
        <div className="overview__caption">
          <p className="eyebrow" data-reveal>
            {t('overview.keysEyebrow')}
          </p>
          <ul className="overview__keys">
            {t('overview.keys').map((k, i) => (
              <li key={k.title} data-reveal>
                <span className="overview__key-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <b>{k.title}</b>
                <span>
                  {k.text
                    .replace('{power}', power.text)
                    .replace('{clearance}', formatSpec('clearance', 'beast', units, lang).text)}
                </span>
              </li>
            ))}
          </ul>
          <p className="overview__summary" data-reveal>
            <b>{t('overview.captionTitle')}</b>
            {t('overview.caption')}
          </p>
        </div>
        <div className="overview__frame overview__frame--c" data-speed="-0.02">
          <Shot id="quarter" />
        </div>
        <SplitText as="p" className="overview__tag reveal-chars" text={t('overview.tag')} key={`tag-${lang}`} />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
const HIGHLIGHTS = [
  { key: 'concept', shot: 'concept' },
  { key: 'exo', shot: 'exo' },
  { key: 'glass', shot: 'glass' },
  { key: 'wheels', shot: 'wheels' },
  { key: 'signature', shot: 'signature' },
]

/** Run `onFocus(key)` when search / garage asks to reveal an item of `kind`. */
function useFocusFlash(kind, onFocus) {
  const cb = useRef(onFocus)
  cb.current = onFocus
  useEffect(() => {
    const on = (e) => e.detail?.kind === kind && cb.current(e.detail.key)
    window.addEventListener('ct:focus', on)
    return () => window.removeEventListener('ct:focus', on)
  }, [kind])
}
const flashEl = (el) => {
  if (!el) return
  el.classList.remove('is-flash')
  void el.offsetWidth
  el.classList.add('is-flash')
  setTimeout(() => el.classList.remove('is-flash'), 2400)
}

function Highlights() {
  const t = useT()
  const lang = useExperience((s) => s.lang)
  const track = useRef()
  const prog = useRef()
  const [active, setActive] = useState(0)
  const drag = useRef({ down: false, x: 0, left: 0, moved: false })

  const cardWidth = () => {
    const card = track.current.querySelector('.hl-card')
    return card.offsetWidth + 16
  }
  const goToCard = (i) => {
    const el = track.current
    const idx = Math.max(0, Math.min(HIGHLIGHTS.length - 1, i))
    el.scrollTo({ left: idx * cardWidth(), behavior: reducedMotion() ? 'auto' : 'smooth' })
  }
  const onScroll = () => {
    const el = track.current
    setActive(Math.round(el.scrollLeft / cardWidth()))
    const max = el.scrollWidth - el.clientWidth
    if (prog.current) prog.current.style.transform = `scaleX(${max > 0 ? 0.15 + (el.scrollLeft / max) * 0.85 : 1})`
  }
  // mouse drag-to-scroll (touch already scrolls natively)
  const onDown = (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return
    drag.current = { down: true, x: e.clientX, left: track.current.scrollLeft, moved: false }
    track.current.classList.add('is-grabbing')
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    track.current.scrollLeft = d.left - dx
  }
  const onUp = () => {
    if (!drag.current.down) return
    drag.current.down = false
    track.current.classList.remove('is-grabbing')
    goToCard(Math.round(track.current.scrollLeft / cardWidth()))
  }
  const onKey = (e) => {
    if (e.key === 'ArrowRight') goToCard(active + 1)
    if (e.key === 'ArrowLeft') goToCard(active - 1)
  }
  useFocusFlash('highlight', (key) => {
    const i = HIGHLIGHTS.findIndex((h) => h.key === key)
    goToCard(i)
    flashEl(track.current?.children[i])
  })

  return (
    <section className="highlights" id="highlights" data-title={t('nav.highlights')}>
      <div className="highlights__head">
        <p className="eyebrow" data-reveal>
          {t('highlights.eyebrow')}
        </p>
        <SplitText as="h2" className="reveal-chars" text={t('highlights.title')} key={`hl-${lang}`} />
        <p className="sec-head__intro" data-reveal>
          {t('highlights.intro')}
        </p>
        <div className="arrows">
          <button onClick={() => goToCard(active - 1)} aria-label={t('highlights.prev')} disabled={active === 0} data-magnetic="0.4">
            <span data-magnetic-inner>←</span>
          </button>
          <button onClick={() => goToCard(active + 1)} aria-label={t('highlights.next')} disabled={active === HIGHLIGHTS.length - 1} data-magnetic="0.4">
            <span data-magnetic-inner>→</span>
          </button>
        </div>
      </div>
      <div
        className="highlights__track"
        ref={track}
        onScroll={onScroll}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onKeyDown={onKey}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('highlights.title')}
      >
        {HIGHLIGHTS.map((h, i) => {
          const title = t(`highlights.items.${h.key}.title`)
          return (
            <article className="hl-card card" key={h.key} aria-label={t('highlights.of', { i: i + 1, n: HIGHLIGHTS.length, title })}>
              <Shot id={h.shot} className="hl-card__shot" label="drag" />
              <div className="hl-card__copy">
                <span className="hl-card__index">0{i + 1}</span>
                <BookmarkButton item={{ id: `highlight:${h.key}`, kind: 'highlight', key: h.key }} name={title} className="hl-card__bm" />
                <h3>{title}</h3>
                <p>{t(`highlights.items.${h.key}.text`)}</p>
              </div>
            </article>
          )
        })}
      </div>
      <div className="carousel-ui">
        <div className="dots" role="tablist" aria-label={t('highlights.choose')}>
          {HIGHLIGHTS.map((h, i) => (
            <button
              key={h.key}
              role="tab"
              aria-selected={i === active}
              aria-label={t(`highlights.items.${h.key}.title`)}
              className={i === active ? 'is-active' : ''}
              onClick={() => goToCard(i)}
            />
          ))}
        </div>
        <i className="carousel-ui__progress">
          <b ref={prog} />
        </i>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
const FEATURES = [
  { key: 'tonneau', shot: 'tonneau' },
  { key: 'frunk', shot: 'frunk' },
  { key: 'air', shot: 'air' },
]

function Power() {
  const t = useT()
  const lang = useExperience((s) => s.lang)
  const [open, setOpen] = useState(null)
  const row = useRef()
  useFocusFlash('feature', (key) => {
    const i = FEATURES.findIndex((f) => f.key === key)
    setOpen(i)
    const el = row.current?.children[i]
    el?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
    flashEl(el)
  })
  return (
    <section className="power" id="power" data-title={t('sections.power')}>
      <div className="power__hero">
        <Shot id="power" className="power__shot" />
        <div className="power__copy">
          <p className="eyebrow eyebrow--ink" data-reveal>
            {t('power.eyebrow')}
          </p>
          <SplitText as="h2" className="reveal-chars" text={t('power.title')} key={`pw-${lang}`} />
          <p data-reveal>{t('power.text')}</p>
          <span data-reveal>
            <button className="btn btn--solid" onClick={() => goTo('technical', t('nav.technical'))} data-magnetic="0.3">
              <span data-magnetic-inner>
                <RollText>{t('power.cta')}</RollText>
              </span>
            </button>
          </span>
        </div>
      </div>
      <div className="power__row" ref={row}>
        {FEATURES.map((f, i) => {
          const title = t(`power.features.${f.key}.title`)
          return (
            <article key={f.key} className={`feature card ${open === i ? 'is-open' : ''}`} data-reveal>
              <Shot id={f.shot} className="feature__shot" />
              <div className="feature__head">
                <h3>{title}</h3>
                <BookmarkButton item={{ id: `feature:${f.key}`, kind: 'feature', key: f.key }} name={title} />
              </div>
              <p id={`feature-${i}`}>{t(`power.features.${f.key}.text`)}</p>
              <button className="feature__more" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`feature-${i}`}>
                <RollText>{open === i ? t('common.showLess') : t('common.showMore')}</RollText>
                <i aria-hidden="true">+</i>
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
function Motors() {
  const t = useT()
  const lang = useExperience((s) => s.lang)
  return (
    <section className="motors" id="motors" data-title={t('sections.motors')}>
      <div className="motors__frame">
        <Shot id="motors" className="motors__shot" />
        <div className="motors__copy">
          <SplitText as="h2" className="reveal-chars" text={t('motors.title')} key={`mo-${lang}`} />
          <p data-reveal>{t('motors.text')}</p>
          <span data-reveal>
            <button className="btn btn--solid" onClick={() => goTo('estimator', t('sections.estimator'))} data-magnetic="0.3">
              <span data-magnetic-inner>
                <RollText>{t('motors.cta')}</RollText>
              </span>
            </button>
          </span>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
function Footer() {
  const t = useT()
  return (
    <footer className="footer">
      <div className="footer__word" aria-hidden="true">
        {'CYBERTRUCK'.split('').map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <div className="footer__bar">
        <p>
          {t('footer.links')} — {t('footer.legal')}
        </p>
        <button className="btn btn--ghost" onClick={() => goTo('anatomy', 'Cybertruck')} data-magnetic="0.3">
          <span data-magnetic-inner>
            <RollText>{t('footer.top')}</RollText>
          </span>
        </button>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
export default function Showcase() {
  const root = useRef()
  const introDone = useExperience((s) => s.introDone)

  useLayoutEffect(() => {
    if (!introDone) return
    const still = reducedMotion()
    const ctx = gsap.context(() => {
      // parallax frames (overview gallery) — desktop only, layout is stacked on phones
      const mm = gsap.matchMedia()
      mm.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('[data-speed]').forEach((el) => {
          const speed = parseFloat(el.dataset.speed)
          gsap.fromTo(
            el,
            { y: () => -speed * window.innerHeight },
            {
              y: () => speed * window.innerHeight,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          )
        })
      })

      // split headings: chars rise out of their masks
      gsap.utils.toArray('.reveal-chars').forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll('.split__char'),
          { yPercent: 115, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: still ? 0 : 1.1,
            stagger: 0.018,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        )
      })

      // generic fade/rise
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: still ? 0 : 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } },
        )
      })

      // shutters lift off each 3D frame as it enters
      gsap.utils.toArray('.frame__shutter').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 1 },
          {
            scaleY: 0,
            duration: still ? 0 : 1.2,
            ease: 'expo.inOut',
            scrollTrigger: { trigger: el.parentElement, start: 'top 92%' },
          },
        )
      })

      // footer word: letters rise in sequence
      gsap.fromTo(
        '.footer__word span',
        { yPercent: 60, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.footer', start: 'top 95%', end: 'bottom bottom', scrub: canHover() ? 1 : false },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [introDone])

  return (
    <div className="showcase" ref={root}>
      <Overview />
      <Highlights />
      <Power />
      <Motors />
      <RangeEstimator />
      <SpecsExplorer />
      <Footer />
    </div>
  )
}
