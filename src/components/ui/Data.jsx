import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Icon from './Icon'
import SplitText from './SplitText'
import { BookmarkButton, Empty, Tip } from './Overlays'
import { useExperience } from '../../store/useExperience'
import { useT } from '../../lib/i18n'
import { LOADS, SPECS, SPEC_CATEGORIES, TRIMS, estimateRange, formatNumber, formatSpec, specById, specKey } from '../../lib/specs'
import { reducedMotion } from '../../lib/interaction'

/** Accessible segmented control (radio group). */
export function Segmented({ label, value, options, onChange, small = false }) {
  return (
    <div className={`seg ${small ? 'seg--sm' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'is-active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function UnitsSwitch() {
  const units = useExperience((s) => s.units)
  const setUnits = useExperience((s) => s.setUnits)
  const t = useT()
  return (
    <Segmented
      small
      label={t('nav.units')}
      value={units}
      onChange={setUnits}
      options={[
        { id: 'us', label: t('nav.imperial') },
        { id: 'metric', label: t('nav.metric') },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Range estimator                                                     */
/* ------------------------------------------------------------------ */
const DEFAULTS = { trim: 'beast', speed: 65, tempC: 20, load: 'empty', covers: true }
const ARC = 2 * Math.PI * 52 * 0.75 // 270° gauge

export function RangeEstimator() {
  const t = useT()
  const units = useExperience((s) => s.units)
  const lang = useExperience((s) => s.lang)
  const [p, setP] = useState(DEFAULTS)
  const r = useMemo(() => estimateRange(p), [p])
  const num = useRef()
  const arc = useRef()
  const shown = useRef({ v: r.miles })
  const metric = units === 'metric'
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }))

  // tween the big number + gauge sweep on every change
  useEffect(() => {
    const target = metric ? r.miles * 1.609 : r.miles
    const o = shown.current
    const tw = gsap.to(o, {
      v: target,
      duration: reducedMotion() ? 0 : 0.8,
      ease: 'power3.out',
      onUpdate: () => {
        if (num.current) num.current.textContent = formatNumber(o.v, lang)
      },
    })
    gsap.to(arc.current, { strokeDashoffset: ARC * (1 - Math.min(1, r.ratio / 1.15)), duration: reducedMotion() ? 0 : 0.9, ease: 'power3.out' })
    return () => tw.kill()
  }, [r, metric, lang])

  // biggest negative factor → advice
  const worst = Object.entries(r.factors).sort((a, b) => a[1] - b[1])[0]
  const impact = worst[1] < 0.97 ? worst[0] : 'none'
  const speedShown = metric ? Math.round(p.speed * 1.609) : p.speed
  const tempShown = metric ? p.tempC : Math.round(p.tempC * 1.8 + 32)
  const eff = metric ? r.whPerMile / 1.609 : r.whPerMile

  return (
    <section className="estimator" id="estimator" data-title={t('sections.estimator')}>
      <header className="sec-head">
        <p className="eyebrow" data-reveal>
          {t('estimator.eyebrow')}
        </p>
        <SplitText as="h2" className="reveal-chars" text={t('estimator.title')} key={`et-${lang}`} />
        <p className="sec-head__intro" data-reveal>
          {t('estimator.intro')}
        </p>
      </header>

      <div className="estimator__grid" data-reveal>
        <form className="estimator__controls" onSubmit={(e) => e.preventDefault()} aria-label={t('sections.estimator')}>
          <div className="field">
            <span className="field__label">{t('estimator.trim')}</span>
            <Segmented label={t('estimator.trim')} value={p.trim} onChange={set('trim')} options={TRIMS.map((x) => ({ id: x.id, label: x.name }))} />
          </div>
          <label className="field">
            <span className="field__label">
              {t('estimator.speed')} <output>{speedShown} {metric ? 'km/h' : 'mph'}</output>
            </span>
            <input type="range" min="40" max="90" step="1" value={p.speed} onChange={(e) => set('speed')(+e.target.value)} style={{ '--p': (p.speed - 40) / 50 }} />
          </label>
          <label className="field">
            <span className="field__label">
              {t('estimator.temp')} <output>{tempShown}° {metric ? 'C' : 'F'}</output>
            </span>
            <input type="range" min="-20" max="40" step="1" value={p.tempC} onChange={(e) => set('tempC')(+e.target.value)} style={{ '--p': (p.tempC + 20) / 60 }} />
          </label>
          <div className="field">
            <span className="field__label">{t('estimator.load')}</span>
            <Segmented small label={t('estimator.load')} value={p.load} onChange={set('load')} options={LOADS.map((l) => ({ id: l.id, label: t(`estimator.loads.${l.id}`) }))} />
          </div>
          <div className="field field--row">
            <span className="field__label">{t('estimator.covers')}</span>
            <Segmented
              small
              label={t('estimator.covers')}
              value={p.covers ? 'on' : 'off'}
              onChange={(v) => set('covers')(v === 'on')}
              options={[
                { id: 'on', label: t('estimator.coversOn') },
                { id: 'off', label: t('estimator.coversOff') },
              ]}
            />
          </div>
          <div className="field field--row">
            <UnitsSwitch />
            <button type="button" className="link" onClick={() => setP(DEFAULTS)}>
              <Icon name="reset" size={14} /> {t('estimator.reset')}
            </button>
          </div>
        </form>

        <div className="estimator__out" aria-live="polite">
          <div className="gauge">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="gauge__track" cx="60" cy="60" r="52" strokeDasharray={`${ARC} 999`} transform="rotate(135 60 60)" />
              <circle ref={arc} className="gauge__fill" cx="60" cy="60" r="52" strokeDasharray={`${ARC} 999`} strokeDashoffset={ARC} transform="rotate(135 60 60)" />
            </svg>
            <div className="gauge__value">
              <small>{t('estimator.result')}</small>
              <b ref={num}>{formatNumber(metric ? r.miles * 1.609 : r.miles, lang)}</b>
              <span>{metric ? 'km' : 'mi'}</span>
              <em>{t('estimator.ofRated', { p: Math.round(r.ratio * 100) })}</em>
            </div>
          </div>
          <dl className="kpis">
            <div>
              <dt>
                {t('estimator.efficiency')} <Tip text={t('estimator.tipEfficiency')} label={t('common.learnMore')} />
              </dt>
              <dd>
                {formatNumber(eff, lang)} <small>Wh/{metric ? 'km' : 'mi'}</small>
              </dd>
            </div>
            <div>
              <dt>{t('estimator.charge')}</dt>
              <dd>{t('estimator.chargeV', { m: Math.round(r.chargeMin) })}</dd>
            </div>
            <div className="kpis__wide">
              <dt>{t('estimator.impact')}</dt>
              <dd className="kpis__advice">{t(`estimator.impacts.${impact}`)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="note">
        <Icon name="info" size={14} /> {t('estimator.note')}
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Specs explorer                                                      */
/* ------------------------------------------------------------------ */
export function SpecsExplorer() {
  const t = useT()
  const units = useExperience((s) => s.units)
  const lang = useExperience((s) => s.lang)
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('default')
  const [compare, setCompare] = useState(true)
  const [trim, setTrim] = useState('beast')
  const [flash, setFlash] = useState(null)
  const body = useRef()

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase()
    let list = SPECS.filter((s) => cat === 'all' || s.cat === cat).filter((s) => {
      if (!nq) return true
      const hay = `${t(specKey(s.id, units))} ${t(`specs.categories.${s.cat}`)} ${formatSpec(s.id, 'beast', units, lang).text}`.toLowerCase()
      return hay.includes(nq)
    })
    if (sort === 'name') list = [...list].sort((a, b) => t(specKey(a.id, units)).localeCompare(t(specKey(b.id, units)), lang))
    if (sort === 'value') {
      const gap = (s) => Math.abs(s.v.beast - s.v.awd) / Math.max(s.v.beast, s.v.awd)
      list = [...list].sort((a, b) => gap(b) - gap(a))
    }
    return list
  }, [cat, q, sort, t, units, lang])

  // animate rows whenever the result set changes
  useLayoutEffect(() => {
    if (!body.current || reducedMotion()) return
    gsap.fromTo(body.current.querySelectorAll('.spec-row'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.025, ease: 'power2.out' })
  }, [rows, compare, trim])

  // deep link from search / garage: reset filters and flash the row
  useEffect(() => {
    const on = (e) => {
      if (e.detail?.kind !== 'spec') return
      setCat('all')
      setQ('')
      setSort('default')
      setFlash(e.detail.key)
      setTimeout(() => {
        document.getElementById(`spec-${e.detail.key}`)?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
      }, 60)
      setTimeout(() => setFlash(null), 2400)
    }
    window.addEventListener('ct:focus', on)
    return () => window.removeEventListener('ct:focus', on)
  }, [])

  const clear = () => {
    setCat('all')
    setQ('')
    setSort('default')
  }

  return (
    <section className="tech" id="technical" data-title={t('nav.technical')}>
      <header className="sec-head">
        <p className="eyebrow" data-reveal>
          {t('specs.eyebrow')}
        </p>
        <SplitText as="h2" className="reveal-chars" text={t('specs.title')} key={`st-${lang}`} />
        <p className="sec-head__intro" data-reveal>
          {t('specs.intro')}
        </p>
      </header>

      <div className="toolbar" data-reveal>
        <div className="chips" role="radiogroup" aria-label={t('specs.categories.performance')}>
          {['all', ...SPEC_CATEGORIES].map((c) => (
            <button key={c} type="button" role="radio" aria-checked={cat === c} className={`chip ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? t('specs.all') : t(`specs.categories.${c}`)}
            </button>
          ))}
        </div>
        <div className="toolbar__right">
          <label className="input">
            <Icon name="search" size={15} />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('specs.search')} aria-label={t('specs.search')} />
          </label>
          <label className="select">
            <span className="sr-only">{t('specs.sort')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('specs.sort')}>
              {Object.keys(t('specs.sorts')).map((k) => (
                <option key={k} value={k}>
                  {t('specs.sort')}: {t(`specs.sorts.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <UnitsSwitch />
          <label className="switch">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
            <i aria-hidden="true" />
            <span>{t('specs.compare')}</span>
          </label>
          {!compare && <Segmented small label={t('estimator.trim')} value={trim} onChange={setTrim} options={TRIMS.map((x) => ({ id: x.id, label: x.name }))} />}
        </div>
      </div>

      <div className={`spec-table ${compare ? 'is-compare' : ''}`} ref={body}>
        <div className="spec-row spec-row--head" aria-hidden="true">
          <span>{t('specs.count', { n: rows.length })}</span>
          {compare ? (
            TRIMS.map((x) => <span key={x.id}>{x.name}</span>)
          ) : (
            <span>{TRIMS.find((x) => x.id === trim).name}</span>
          )}
          <span />
        </div>
        {rows.length === 0 ? (
          <Empty title={t('specs.empty', { q })} hint={t('specs.emptyHint')}>
            <button className="btn btn--ghost" onClick={clear}>
              {t('specs.clear')}
            </button>
          </Empty>
        ) : (
          rows.map((s) => {
            const label = t(specKey(s.id, units))
            const differs = s.v.awd !== s.v.beast
            return (
              <div key={s.id} id={`spec-${s.id}`} className={`spec-row ${flash === s.id ? 'is-flash' : ''}`}>
                <span className="spec-row__label">
                  {label}
                  {s.tip && <Tip text={t(`specs.tips.${s.tip}`)} label={`${t('common.learnMore')}: ${label}`} />}
                  <small>{t(`specs.categories.${s.cat}`)}</small>
                </span>
                {compare ? (
                  TRIMS.map((x) => (
                    <span key={x.id} className={`spec-row__val ${differs && s.id !== 'weight' && s.v[x.id] === (s.id === 'accel' ? Math.min : Math.max)(s.v.awd, s.v.beast) ? 'is-best' : ''}`}>
                      <span className="spec-row__trim">{x.name}</span>
                      {formatSpec(s.id, x.id, units, lang).text}
                    </span>
                  ))
                ) : (
                  <span className="spec-row__val">{formatSpec(s.id, trim, units, lang).text}</span>
                )}
                <BookmarkButton item={{ id: `spec:${s.id}`, kind: 'spec', key: s.id }} name={label} />
              </div>
            )
          })
        )}
      </div>
      <p className="note">
        <Icon name="info" size={14} /> {t('common.approx')}
      </p>
    </section>
  )
}

export { specById }
