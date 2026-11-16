import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Icon from './Icon'
import { useExperience } from '../../store/useExperience'
import { useT } from '../../lib/i18n'
import { toggleBookmark } from '../../lib/actions'

/* ------------------------------------------------------------------ */
/* Modal — accessible dialog shell (focus trap, Esc, scrim, animation)  */
/* ------------------------------------------------------------------ */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, labelledBy, className = '', children, initialFocus }) {
  const [mounted, setMounted] = useState(open)
  const root = useRef()
  const panel = useRef()
  const lastFocus = useRef(null)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useLayoutEffect(() => {
    if (!mounted) return
    const r = root.current
    const p = panel.current
    if (open) {
      lastFocus.current = document.activeElement
      gsap.fromTo(r, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(p, { y: 24, scale: 0.98 }, { y: 0, scale: 1, duration: 0.55, ease: 'expo.out' })
      const target = (initialFocus && p.querySelector(initialFocus)) || p.querySelector(FOCUSABLE)
      requestAnimationFrame(() => target?.focus())
    } else {
      gsap.to(p, { y: 12, scale: 0.985, duration: 0.25, ease: 'power2.in' })
      gsap.to(r, {
        autoAlpha: 0,
        duration: 0.25,
        onComplete: () => {
          setMounted(false)
          lastFocus.current?.focus?.()
        },
      })
    }
  }, [open, mounted, initialFocus])

  if (!mounted) return null
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
    if (e.key === 'Tab') {
      const f = [...panel.current.querySelectorAll(FOCUSABLE)]
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  return (
    <div className="modal" ref={root} onKeyDown={onKey}>
      <div className="modal__scrim" onClick={onClose} />
      <div className={`modal__panel ${className}`} ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Confirm dialog (driven by store.confirm())                           */
/* ------------------------------------------------------------------ */
export function ConfirmDialog() {
  const dialog = useExperience((s) => s.dialog)
  const resolve = useExperience((s) => s.resolveDialog)
  const t = useT()
  const [last, setLast] = useState(null)
  useEffect(() => {
    if (dialog) setLast(dialog)
  }, [dialog])
  const d = dialog ?? last
  return (
    <Modal open={!!dialog} onClose={() => resolve(false)} labelledBy="confirm-title" className="confirm" initialFocus=".confirm__cancel">
      {d && (
        <>
          <div className={`confirm__icon ${d.danger ? 'is-danger' : ''}`}>
            <Icon name={d.danger ? 'warning' : 'info'} size={20} />
          </div>
          <h2 id="confirm-title">{d.title}</h2>
          {d.body && <p>{d.body}</p>}
          <div className="confirm__actions">
            <button className="btn btn--ghost confirm__cancel" onClick={() => resolve(false)}>
              {t('common.cancel')}
            </button>
            <button className={`btn ${d.danger ? 'btn--danger' : 'btn--solid'}`} onClick={() => resolve(true)}>
              {d.confirmLabel ?? t('common.confirm')}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */
function Toast({ toast }) {
  const dismiss = useExperience((s) => s.dismissToast)
  const el = useRef()
  const timer = useRef()
  const t = useT()
  const leave = () => {
    clearTimeout(timer.current)
    gsap.to(el.current, { x: 40, autoAlpha: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.in', onComplete: () => dismiss(toast.id) })
  }
  const arm = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(leave, toast.action ? 6000 : 3600)
  }
  useLayoutEffect(() => {
    gsap.fromTo(el.current, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' })
    arm()
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const icon = { success: 'check', error: 'warning', info: 'info' }[toast.type] ?? 'info'
  return (
    <div className={`toast toast--${toast.type}`} ref={el} onMouseEnter={() => clearTimeout(timer.current)} onMouseLeave={arm} role={toast.type === 'error' ? 'alert' : 'status'}>
      <Icon name={icon} size={16} />
      <span className="toast__msg">{toast.message}</span>
      {toast.action && (
        <button
          className="toast__action"
          onClick={() => {
            toast.action.run()
            leave()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button className="toast__close" onClick={leave} aria-label={t('common.close')}>
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

export function Toasts() {
  const toasts = useExperience((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tooltip — hover / focus on desktop, tap to toggle on touch          */
/* ------------------------------------------------------------------ */
export function Tip({ text, label = 'More info' }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className={`tip ${open ? 'is-open' : ''}`} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="tip__btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        <Icon name="info" size={14} />
      </button>
      <span className="tip__bubble" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Bookmark toggle with a pop micro-interaction                        */
/* ------------------------------------------------------------------ */
export function BookmarkButton({ item, name, className = '' }) {
  const on = useExperience((s) => s.bookmarks.some((b) => b.id === item.id))
  const t = useT()
  const ref = useRef()
  const click = (e) => {
    e.stopPropagation()
    toggleBookmark(item)
    gsap.fromTo(ref.current, { scale: 0.7 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' })
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`bookmark ${on ? 'is-on' : ''} ${className}`}
      onClick={click}
      aria-pressed={on}
      aria-label={t(on ? 'bookmark.remove' : 'bookmark.add', { name })}
    >
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} size={16} />
    </button>
  )
}

/** Shared empty-state block. */
export function Empty({ icon = 'search', title, hint, children }) {
  return (
    <div className="empty" role="status">
      <span className="empty__icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="empty__title">{title}</p>
      {hint && <p className="empty__hint">{hint}</p>}
      {children}
    </div>
  )
}
