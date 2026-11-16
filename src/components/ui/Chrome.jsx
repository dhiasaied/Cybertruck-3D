import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Icon from './Icon'
import { Modal } from './Overlays'
import { useExperience } from '../../store/useExperience'
import { useT } from '../../lib/i18n'
import { toggleLang, toggleTheme, toggleUnits } from '../../lib/actions'
import { goTo } from './Transition'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/* Loader                                                               */
/* ------------------------------------------------------------------ */
/**
 * Dark navy boot screen with the reference's blinking caret, plus a real
 * progress readout (fonts + WebGL scene). Exits by lifting away so the dark
 * garage intro continues seamlessly underneath.
 */
export function Loader() {
  const ready = useExperience((s) => s.ready)
  const t = useT()
  const ref = useRef()
  const num = useRef()
  const bar = useRef()
  const [gone, setGone] = useState(false)
  const progress = useRef({ v: 0 })

  // creep toward 90% while loading
  useEffect(() => {
    const p = progress.current
    const tw = gsap.to(p, {
      v: 90,
      duration: 3,
      ease: 'power2.out',
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(p.v)).padStart(3, '0')
        if (bar.current) bar.current.style.transform = `scaleX(${p.v / 100})`
      },
    })
    return () => tw.kill()
  }, [])

  useEffect(() => {
    if (!ready) return
    const p = progress.current
    let killed = false
    let tl
    const fonts = document.fonts?.ready ?? Promise.resolve()
    fonts.then(() => {
      if (killed) return
      tl = gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(p, {
          v: 100,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            // the loader may already be gone (see fallback below) — never write to detached refs
            if (num.current) num.current.textContent = String(Math.round(p.v)).padStart(3, '0')
            if (bar.current) bar.current.style.transform = `scaleX(${p.v / 100})`
          },
        })
        .to(ref.current.querySelectorAll('.loader__word span'), { yPercent: -110, duration: 0.6, stagger: 0.025, ease: 'expo.in' })
        .to(ref.current, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.2')
    })
    // never let a throttled/background tab keep the boot screen up
    const fallback = setTimeout(() => {
      tl?.kill()
      gsap.killTweensOf(p)
      setGone(true)
    }, 5000)
    return () => {
      killed = true
      clearTimeout(fallback)
      tl?.kill()
    }
  }, [ready])

  if (gone) return null
  return (
    <div className="loader" ref={ref} role="status" aria-label={t('loader.label')}>
      <i className="loader__caret" />
      <div className="loader__word" aria-hidden="true">
        {'CYBERTRUCK'.split('').map((c, i) => (
          <span key={i} style={{ animationDelay: `${0.15 + i * 0.04}s` }}>
            {c}
          </span>
        ))}
      </div>
      <div className="loader__foot" aria-hidden="true">
        <span>{t('loader.status')}</span>
        <i className="loader__track">
          <b ref={bar} />
        </i>
        <span ref={num}>000</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nav                                                                  */
/* ------------------------------------------------------------------ */
const LINKS = [
  { id: 'anatomy', key: 'nav.anatomy' },
  { id: 'highlights', key: 'nav.highlights' },
  { id: 'technical', key: 'nav.technical', short: 'nav.technicalShort' },
]

/** Text that rolls to a duplicate of itself (or `alt`) on hover / focus. */
export function RollText({ children, alt }) {
  return (
    <span className="roll" data-text={alt ?? children}>
      <span>{children}</span>
    </span>
  )
}

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

/** The global actions (search, garage, theme, language, help). Used in the bar and the mobile menu. */
function NavActions({ inMenu = false }) {
  const t = useT()
  const theme = useExperience((s) => s.theme)
  const lang = useExperience((s) => s.lang)
  const count = useExperience((s) => s.builds.length + s.bookmarks.length)
  const st = useExperience.getState
  const badge = useRef()
  const prev = useRef(count)
  useEffect(() => {
    if (count > prev.current && badge.current) gsap.fromTo(badge.current, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
    prev.current = count
  }, [count])

  const items = [
    { id: 'search', icon: 'search', label: t('nav.search'), run: () => st().setSearchOpen(true), kbd: `${isMac ? '⌘' : 'Ctrl'} K` },
    { id: 'garage', icon: 'garage', label: t('nav.garage'), run: () => st().setGarageOpen(true), count },
    { id: 'theme', icon: theme === 'dark' ? 'sun' : 'moon', label: t(theme === 'dark' ? 'nav.themeToLight' : 'nav.themeToDark'), run: toggleTheme },
    { id: 'lang', icon: 'globe', label: t('nav.language'), run: toggleLang, text: lang === 'en' ? 'FR' : 'EN' },
    { id: 'help', icon: 'help', label: t('nav.help'), run: () => st().setHelpOpen(true) },
  ]
  if (inMenu)
    return (
      <ul className="menu__actions">
        {items.map((it) => (
          <li key={it.id}>
            <button onClick={it.run}>
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
              {it.count > 0 && <em className="badge">{it.count}</em>}
            </button>
          </li>
        ))}
        <li>
          <button onClick={toggleUnits}>
            <Icon name="ruler" size={18} />
            <span>
              {t('nav.units')} · {t(useExperience.getState().units === 'us' ? 'nav.imperial' : 'nav.metric')}
            </span>
          </button>
        </li>
      </ul>
    )
  return (
    <div className="nav__actions">
      {items.map((it) => (
        <button key={it.id} className={`nav__icon nav__icon--${it.id}`} onClick={it.run} aria-label={it.label} title={it.kbd ? `${it.label} (${it.kbd})` : it.label} data-magnetic="0.3">
          {it.text ? <span className="nav__lang">{it.text}</span> : <Icon name={it.icon} size={17} />}
          {it.count > 0 && (
            <em className="badge" ref={badge}>
              {it.count}
            </em>
          )}
        </button>
      ))}
    </div>
  )
}

/** Full-screen menu for phones: section links + every action. */
function MobileMenu({ active, onNavigate }) {
  const open = useExperience((s) => s.menuOpen)
  const setOpen = useExperience((s) => s.setMenuOpen)
  const t = useT()
  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="menu-title" className="menu">
      <header className="drawer__head">
        <h2 id="menu-title">{t('nav.menu')}</h2>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t('common.close')}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <nav aria-label={t('nav.sections')}>
        <ol className="menu__links">
          {LINKS.map((l, i) => (
            <li key={l.id}>
              <button className={active === l.id ? 'is-active' : ''} onClick={() => onNavigate(l)}>
                <small>0{i + 1}</small> {t(l.key)}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => {
                setOpen(false)
                useExperience.getState().setPanelOpen(true)
              }}
            >
              <small>04</small> {t('nav.configure')}
            </button>
          </li>
        </ol>
      </nav>
      <NavActions inMenu />
    </Modal>
  )
}

/**
 * Top bar: brand · centred section links with a sliding active marker ·
 * global actions · configurator toggle. Hides while scrolling down.
 */
export function Nav() {
  const introDone = useExperience((s) => s.introDone)
  const setPanelOpen = useExperience((s) => s.setPanelOpen)
  const panelOpen = useExperience((s) => s.panelOpen)
  const setMenuOpen = useExperience((s) => s.setMenuOpen)
  const lang = useExperience((s) => s.lang)
  const t = useT()
  const [active, setActive] = useState('anatomy')
  const ref = useRef()
  const links = useRef()
  const marker = useRef()

  useEffect(() => {
    gsap.to(ref.current, { autoAlpha: introDone ? 1 : 0, y: introDone ? 0 : -16, duration: 1, ease: 'expo.out' })
  }, [introDone])

  // active section + hide on scroll down
  useLayoutEffect(() => {
    if (!introDone) return
    const ctx = gsap.context(() => {
      LINKS.forEach(({ id }) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => self.isActive && setActive(id),
        })
      })
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const s = useExperience.getState()
          const hide = self.direction === 1 && self.scroll() > 200 && !s.panelOpen && !s.menuOpen
          gsap.to(ref.current, { yPercent: hide ? -120 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
        },
      })
    })
    return () => ctx.revert()
  }, [introDone])

  // slide the marker under the active link (re-measure when the language changes widths)
  useLayoutEffect(() => {
    const btn = links.current?.querySelector(`[data-id="${active}"]`)
    if (!btn || !marker.current) return
    gsap.to(marker.current, { x: btn.offsetLeft, width: btn.offsetWidth, duration: 0.6, ease: 'expo.out' })
  }, [active, introDone, lang])

  const navigate = (l) => {
    setMenuOpen(false)
    setTimeout(() => goTo(l.id, t(l.key)), 120)
  }

  return (
    <>
      <header className="nav" ref={ref}>
        <button className="nav__brand" onClick={() => goTo('anatomy', 'Cybertruck')} aria-label={t('nav.backToTop')} data-magnetic="0.3">
          <svg viewBox="0 0 64 16" aria-hidden="true">
            <path d="M1 13 L27 2 L63 8 L63 13 Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 13 H61" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <nav className="nav__links" aria-label={t('nav.sections')} ref={links}>
          {LINKS.map((l) => (
            <button
              key={l.id}
              data-id={l.id}
              className={active === l.id ? 'is-active' : ''}
              aria-current={active === l.id ? 'true' : undefined}
              aria-label={t(l.key)}
              onClick={() => goTo(l.id, t(l.key))}
            >
              <span className={l.short ? 'nav__long' : undefined}>
                <RollText>{t(l.key)}</RollText>
              </span>
              {l.short && (
                <span className="nav__short" aria-hidden="true">
                  <RollText>{t(l.short)}</RollText>
                </span>
              )}
            </button>
          ))}
          <i className="nav__marker" ref={marker} aria-hidden="true" />
        </nav>
        <div className="nav__end">
          <NavActions />
          <button
            className={`nav__model ${panelOpen ? 'is-open' : ''}`}
            onClick={() => setPanelOpen(!panelOpen)}
            aria-expanded={panelOpen}
            aria-controls="configurator"
            aria-label={t(panelOpen ? 'nav.closeConfigurator' : 'nav.openConfigurator')}
            data-magnetic="0.25"
          >
            <span className="nav__model-label">
              <RollText alt={t('nav.configure')}>Cybertruck · AWD</RollText>
            </span>
            <span className="nav__dot" aria-hidden="true" />
          </button>
          <button className="nav__icon nav__menu" onClick={() => setMenuOpen(true)} aria-label={t('nav.menu')} aria-haspopup="dialog">
            <Icon name="menu" size={18} />
          </button>
        </div>
      </header>
      <MobileMenu active={active} onNavigate={navigate} />
    </>
  )
}

/** Small persistent pill at the bottom centre (as in the reference). */
export function ScrollPill() {
  return <div className="pill" aria-hidden="true" />
}

/**
 * Ambient background for the dark sections (sits under the transparent WebGL
 * canvas): two slow-drifting light pools + fine film grain.
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <i className="backdrop__glow backdrop__glow--a" />
      <i className="backdrop__glow backdrop__glow--b" />
      <svg className="backdrop__grain">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  )
}
