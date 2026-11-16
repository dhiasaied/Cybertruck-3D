import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Icon from './Icon'
import { Empty, Modal } from './Overlays'
import { useExperience } from '../../store/useExperience'
import { useT, LANGS } from '../../lib/i18n'
import { SHOTS } from '../../lib/stage'
import { SPECS, formatSpec, specKey } from '../../lib/specs'
import { FINISHES, PALETTES } from '../../lib/presets'
import {
  clearBookmarks,
  deleteBuild,
  saveCurrentBuild,
  shareBuild,
  toggleLang,
  toggleTheme,
  toggleUnits,
} from '../../lib/actions'
import { SECTION_IDS, bookmarkTitle, openBookmark, openChapter, openFeature, openHighlight, openSection, openSpec } from '../../lib/navigate'

const HL_KEYS = ['concept', 'exo', 'glass', 'wheels', 'signature']
const FEATURE_KEYS = ['tonneau', 'frunk', 'air']
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/* ------------------------------------------------------------------ */
/* Search palette (Ctrl/⌘ K)                                           */
/* ------------------------------------------------------------------ */
function useSearchIndex() {
  const t = useT()
  const units = useExperience((s) => s.units)
  const lang = useExperience((s) => s.lang)
  return useMemo(() => {
    const S = useExperience.getState
    const items = []
    SECTION_IDS.forEach((id) => items.push({ group: 'sections', id: `s:${id}`, title: t(`sections.${id}`), icon: 'arrowRight', run: () => openSection(id) }))
    const seen = new Set()
    SHOTS.forEach((shot, i) => {
      const name = t(`chapters.${shot.id}`)
      if (seen.has(name) || i === 0) return
      seen.add(name)
      items.push({ group: 'chapters', id: `c:${shot.id}`, title: name, sub: `${String(i + 1).padStart(2, '0')}/12`, icon: 'arrowRight', run: () => openChapter(i) })
    })
    HL_KEYS.forEach((k) =>
      items.push({ group: 'highlights', id: `h:${k}`, title: t(`highlights.items.${k}.title`), sub: t(`highlights.items.${k}.text`), icon: 'bookmark', run: () => openHighlight(k) }),
    )
    FEATURE_KEYS.forEach((k) =>
      items.push({ group: 'highlights', id: `f:${k}`, title: t(`power.features.${k}.title`), sub: t(`power.features.${k}.text`), icon: 'bookmark', run: () => openFeature(k) }),
    )
    SPECS.forEach((s) =>
      items.push({
        group: 'specs',
        id: `p:${s.id}`,
        title: t(specKey(s.id, units)),
        sub: `${formatSpec(s.id, 'beast', units, lang).text} · ${t(`specs.categories.${s.cat}`)}`,
        icon: 'ruler',
        run: () => openSpec(s.id),
      }),
    )
    const actions = [
      { id: 'theme', title: t('search.actions.theme'), icon: S().theme === 'dark' ? 'sun' : 'moon', run: toggleTheme, kw: 'dark light sombre clair theme' },
      { id: 'lang', title: t('search.actions.lang'), icon: 'globe', run: toggleLang, kw: 'language langue english français french anglais' },
      { id: 'units', title: t(units === 'us' ? 'search.actions.units' : 'search.actions.unitsBack'), icon: 'ruler', run: toggleUnits, kw: 'units km kg metric imperial unités' },
      { id: 'configure', title: t('search.actions.configure'), icon: 'sliders', run: () => S().setPanelOpen(true), kw: 'color colour couleur finish' },
      { id: 'garage', title: t('search.actions.garage'), icon: 'garage', run: () => S().setGarageOpen(true), kw: 'favorites bookmarks favoris' },
      { id: 'save', title: t('search.actions.save'), icon: 'plus', run: saveCurrentBuild, kw: 'save build enregistrer' },
      { id: 'help', title: t('search.actions.help'), icon: 'help', run: () => S().setHelpOpen(true), kw: 'shortcuts raccourcis aide' },
    ]
    actions.forEach((a) => items.push({ group: 'actions', ...a, id: `a:${a.id}` }))
    return items.map((it) => ({ ...it, hay: norm(`${it.title} ${it.sub ?? ''} ${it.kw ?? ''}`), head: norm(it.title) }))
  }, [t, units, lang])
}

function score(item, q) {
  if (!q) return 1
  const words = q.split(/\s+/).filter(Boolean)
  let s = 0
  for (const w of words) {
    if (item.head.startsWith(w)) s += 6
    else if (item.head.includes(w)) s += 4
    else if (item.hay.includes(w)) s += 1
    else return 0
  }
  return s
}

export function SearchPalette() {
  const open = useExperience((s) => s.searchOpen)
  const setOpen = useExperience((s) => s.setSearchOpen)
  const t = useT()
  const index = useSearchIndex()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const list = useRef()

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
    }
  }, [open])

  const results = useMemo(() => {
    const nq = norm(q.trim())
    const scored = index.map((it) => ({ it, s: score(it, nq) })).filter((x) => x.s > 0)
    if (nq) scored.sort((a, b) => b.s - a.s)
    return scored.map((x) => x.it).slice(0, nq ? 12 : 40)
  }, [index, q])

  // keep the active row in view
  useLayoutEffect(() => {
    list.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (it) => {
    setOpen(false)
    setTimeout(() => it.run(), 260) // let the dialog leave first
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      run(results[active])
    }
  }

  let lastGroup = null
  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="search-label" className="palette-dialog" initialFocus="input">
      <label className="search__field" id="search-label">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKey}
          placeholder={t('search.placeholder')}
          aria-label={t('nav.search')}
          role="combobox"
          aria-expanded="true"
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
          autoComplete="off"
          spellCheck="false"
        />
        <kbd>Esc</kbd>
      </label>
      <div className="search__results" id="search-results" role="listbox" ref={list} aria-label={t('nav.search')}>
        {results.length === 0 && <Empty title={t('search.empty', { q })} hint={t('search.emptyHint')} />}
        {results.map((it, i) => {
          const header = it.group !== lastGroup ? t(`search.groups.${it.group}`) : null
          lastGroup = it.group
          return (
            <div key={it.id}>
              {header && <p className="search__group">{header}</p>}
              <button
                type="button"
                id={`sr-${it.id}`}
                data-idx={i}
                role="option"
                aria-selected={i === active}
                className={`search__item ${i === active ? 'is-active' : ''}`}
                onMouseMove={() => setActive(i)}
                onClick={() => run(it)}
              >
                <Icon name={it.icon} size={16} />
                <span className="search__text">
                  <b>{it.title}</b>
                  {it.sub && <small>{it.sub}</small>}
                </span>
                <Icon name="arrowRight" size={14} className="search__go" />
              </button>
            </div>
          )
        })}
      </div>
      <p className="search__hint">{t('search.hint')}</p>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Garage drawer: saved builds + bookmarks                             */
/* ------------------------------------------------------------------ */
function BuildRow({ b, current }) {
  const t = useT()
  const apply = useExperience((s) => s.applyBuild)
  const notify = useExperience((s) => s.notify)
  const finish = FINISHES.find((f) => f.id === b.finishId)
  const palette = PALETTES.find((p) => p.id === b.paletteId)
  const color = b.finishId === 'custom' ? b.customColor : finish?.color
  const date = new Date(b.at).toLocaleDateString(useExperience.getState().lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
  return (
    <li className={`build ${current ? 'is-current' : ''}`}>
      <span className="build__swatch" style={{ '--c': color, '--p': palette?.accent }} aria-hidden="true" />
      <span className="build__text">
        <b>{b.name}</b>
        <small>{current ? t('garage.current') : date}</small>
      </span>
      <span className="build__actions">
        <button
          className="icon-btn"
          onClick={() => {
            apply(b)
            notify(t('garage.applied'), { type: 'success' })
          }}
          aria-label={`${t('common.apply')}: ${b.name}`}
          title={t('common.apply')}
          disabled={current}
        >
          <Icon name="check" size={16} />
        </button>
        <button className="icon-btn" onClick={() => shareBuild(b)} aria-label={`${t('common.share')}: ${b.name}`} title={t('common.share')}>
          <Icon name="share" size={16} />
        </button>
        <button className="icon-btn icon-btn--danger" onClick={() => deleteBuild(b)} aria-label={`${t('common.delete')}: ${b.name}`} title={t('common.delete')}>
          <Icon name="trash" size={16} />
        </button>
      </span>
    </li>
  )
}

export function Garage() {
  const open = useExperience((s) => s.garageOpen)
  const setOpen = useExperience((s) => s.setGarageOpen)
  const builds = useExperience((s) => s.builds)
  const bookmarks = useExperience((s) => s.bookmarks)
  const toggleBm = useExperience((s) => s.toggleBookmark)
  const curF = useExperience((s) => s.finishId)
  const curP = useExperience((s) => s.paletteId)
  const curC = useExperience((s) => s.customColor)
  const cur = { f: curF, p: curP, c: curC }
  const t = useT()
  const [tab, setTab] = useState('builds')
  const body = useRef()

  useLayoutEffect(() => {
    if (!open || !body.current) return
    gsap.fromTo(body.current.querySelectorAll('li, .empty'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.45, ease: 'power3.out' })
  }, [open, tab])

  const isCurrent = (b) => b.finishId === cur.f && b.paletteId === cur.p && (b.finishId !== 'custom' || b.customColor === cur.c)

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="garage-title" className="drawer">
      <header className="drawer__head">
        <h2 id="garage-title">
          <Icon name="garage" size={18} /> {t('garage.title')}
        </h2>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t('common.close')}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="tabs" role="tablist">
        {['builds', 'saved'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>
            {t(`garage.${k}`)}
            <span className="tabs__count">{k === 'builds' ? builds.length : bookmarks.length}</span>
          </button>
        ))}
      </div>
      <div className="drawer__body" ref={body} role="tabpanel">
        {tab === 'builds' ? (
          <>
            <button className="btn btn--solid drawer__cta" onClick={saveCurrentBuild}>
              <Icon name="plus" size={16} /> {t('garage.saveCurrent')}
            </button>
            {builds.length === 0 ? (
              <Empty icon="garage" title={t('garage.emptyBuilds')} hint={t('garage.emptyBuildsHint')} />
            ) : (
              <ul className="list">
                {builds.map((b) => (
                  <BuildRow key={b.id} b={b} current={isCurrent(b)} />
                ))}
              </ul>
            )}
          </>
        ) : bookmarks.length === 0 ? (
          <Empty icon="bookmark" title={t('garage.emptySaved')} hint={t('garage.emptySavedHint')} />
        ) : (
          <>
            <ul className="list">
              {bookmarks.map((b) => (
                <li key={b.id} className="saved">
                  <button
                    className="saved__open"
                    onClick={() => {
                      setOpen(false)
                      setTimeout(() => openBookmark(b), 260)
                    }}
                  >
                    <small>{t(b.kind === 'spec' ? 'search.groups.specs' : 'search.groups.highlights')}</small>
                    <b>{bookmarkTitle(b, t, useExperience.getState().units)}</b>
                  </button>
                  <button className="icon-btn" onClick={() => toggleBm(b)} aria-label={`${t('common.remove')}: ${bookmarkTitle(b, t)}`} title={t('common.remove')}>
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <button className="link drawer__clear" onClick={clearBookmarks}>
              {t('common.clearAll')}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Help & shortcuts                                                    */
/* ------------------------------------------------------------------ */
const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
export const KEYS = [
  { keys: [isMac ? '⌘' : 'Ctrl', 'K'], id: 'search' },
  { keys: ['/'], id: 'search' },
  { keys: ['G'], id: 'garage' },
  { keys: ['C'], id: 'configure' },
  { keys: ['T'], id: 'theme' },
  { keys: ['?'], id: 'help' },
  { keys: ['Esc'], id: 'close' },
]

export function Help() {
  const open = useExperience((s) => s.helpOpen)
  const setOpen = useExperience((s) => s.setHelpOpen)
  const lang = useExperience((s) => s.lang)
  const t = useT()
  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="help-title" className="help">
      <header className="drawer__head">
        <h2 id="help-title">
          <Icon name="help" size={18} /> {t('help.title')}
        </h2>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t('common.close')}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="help__grid">
        <section>
          <h3>{t('help.explore')}</h3>
          <ol className="help__tips">
            {t('help.tips').map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </section>
        <section>
          <h3>{t('help.shortcuts')}</h3>
          <dl className="keys">
            {KEYS.map((k) => (
              <div key={k.keys.join()}>
                <dt>
                  {k.keys.map((x) => (
                    <kbd key={x}>{x}</kbd>
                  ))}
                </dt>
                <dd>{t(`help.keys.${k.id}`)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <p className="help__privacy">
        <Icon name="info" size={14} /> {t('help.privacy')} · {LANGS.find((l) => l.id === lang)?.label}
      </p>
    </Modal>
  )
}
