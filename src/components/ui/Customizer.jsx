import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { FINISHES, PALETTES } from '../../lib/presets'
import { useExperience } from '../../store/useExperience'
import { useT } from '../../lib/i18n'
import { saveCurrentBuild, shareBuild } from '../../lib/actions'
import Icon from './Icon'
import { Segmented } from './Data'

/**
 * Configurator drawer (opened from the model label, top right):
 * exterior finish for every truck on the page, site accent palette, graphics tier.
 */
export default function Customizer() {
  const open = useExperience((s) => s.panelOpen)
  const setOpen = useExperience((s) => s.setPanelOpen)
  const finishId = useExperience((s) => s.finishId)
  const setFinish = useExperience((s) => s.setFinish)
  const paletteId = useExperience((s) => s.paletteId)
  const setPalette = useExperience((s) => s.setPalette)
  const customColor = useExperience((s) => s.customColor)
  const setCustomColor = useExperience((s) => s.setCustomColor)
  const quality = useExperience((s) => s.quality)
  const setQuality = useExperience((s) => s.setQuality)
  const ref = useRef()

  useEffect(() => {
    const el = ref.current
    if (open) {
      gsap.fromTo(el, { y: window.innerWidth <= 820 ? 60 : -12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' })
      gsap.fromTo(el.querySelectorAll('.cz__group'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5, delay: 0.05 })
    } else {
      gsap.to(el, { autoAlpha: 0, y: window.innerWidth <= 820 ? 40 : -12, duration: 0.35, ease: 'power2.in' })
    }
  }, [open])


  const t = useT()

  return (
    <aside className="cz" id="configurator" ref={ref} aria-label={t('nav.configure')} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="cz__head">
        <span>{t('configurator.title')}</span>
        <button className="cz__close" onClick={() => setOpen(false)} aria-label={t('nav.closeConfigurator')}>
          ×
        </button>
      </div>

      <div className="cz__group">
        <div className="cz__label">
          {t('configurator.exterior')} <b>{t(`finishes.${finishId}`)}</b>
        </div>
        <div className="cz__swatches" role="radiogroup" aria-label={t('configurator.exterior')}>
          {FINISHES.filter((f) => f.id !== 'custom').map((f) => (
            <button
              key={f.id}
              role="radio"
              aria-checked={finishId === f.id}
              className={`swatch ${finishId === f.id ? 'is-active' : ''} ${f.brushed ? 'swatch--brushed' : ''}`}
              style={{ '--c': f.color }}
              onClick={() => setFinish(f.id)}
              aria-label={t(`finishes.${f.id}`)}
              title={t(`finishes.${f.id}`)}
            />
          ))}
          <label className={`swatch swatch--picker ${finishId === 'custom' ? 'is-active' : ''}`} title={t('configurator.custom')}>
            <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} aria-label={t('configurator.custom')} />
            <span style={{ '--c': customColor }} />
          </label>
        </div>
      </div>

      <div className="cz__group">
        <div className="cz__label">
          {t('configurator.palette')} <b>{t(`palettes.${paletteId}`)}</b>
        </div>
        <div className="cz__palettes" role="radiogroup" aria-label={t('configurator.palette')}>
          {PALETTES.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={paletteId === p.id}
              className={`palette ${paletteId === p.id ? 'is-active' : ''}`}
              onClick={() => setPalette(p.id)}
              aria-label={t(`palettes.${p.id}`)}
              title={t(`palettes.${p.id}`)}
            >
              <span style={{ background: p.accent }} />
              <span style={{ background: p.dark }} />
            </button>
          ))}
        </div>
      </div>

      <div className="cz__group">
        <div className="cz__label">{t('configurator.graphics')}</div>
        <Segmented label={t('configurator.graphics')} value={quality} onChange={setQuality} options={['low', 'medium', 'high'].map((q) => ({ id: q, label: t(`configurator.q.${q}`) }))} />
      </div>

      <div className="cz__group cz__actions">
        <button className="btn btn--solid" onClick={saveCurrentBuild}>
          <Icon name="plus" size={15} /> {t('configurator.saveBuild')}
        </button>
        <button className="icon-btn" onClick={() => shareBuild()} aria-label={t('configurator.shareBuild')} title={t('configurator.shareBuild')}>
          <Icon name="share" size={16} />
        </button>
      </div>
    </aside>
  )
}
