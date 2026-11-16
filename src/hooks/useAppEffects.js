import { useEffect } from 'react'
import { useExperience, isStorageOk } from '../store/useExperience'
import { translate, tNow } from '../lib/i18n'
import { applySharedBuildFromUrl, toggleTheme } from '../lib/actions'

/** Mirror language + theme onto <html> and the document metadata. */
export function useDocumentPrefs() {
  const lang = useExperience((s) => s.lang)
  const theme = useExperience((s) => s.theme)
  useEffect(() => {
    const html = document.documentElement
    html.lang = lang
    document.title = translate(lang, 'meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(lang, 'meta.description'))
  }, [lang])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#16171a' : '#f2f1ee')
  }, [theme])
}

/** Global keyboard shortcuts (ignored while typing in a field). */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      const s = useExperience.getState()
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        s.setSearchOpen(!s.searchOpen)
        return
      }
      if (e.key === 'Escape') {
        if (s.dialog) return // the confirm dialog handles its own Esc
        s.closeAll()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (e.key === '/') {
        e.preventDefault()
        s.setSearchOpen(true)
      } else if (e.key === '?') s.setHelpOpen(true)
      else if (k === 'g') s.setGarageOpen(!s.garageOpen)
      else if (k === 'c') s.setPanelOpen(!s.panelOpen)
      else if (k === 't') toggleTheme()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** WebGL availability check — without it the site still works, minus live renders. */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** One-off boot tasks: shared-build links, storage warning, no-WebGL mode. */
export function useBootChecks() {
  useEffect(() => {
    const s = useExperience.getState()
    if (!hasWebGL()) {
      s.setWebgl(false)
      document.documentElement.classList.add('no-webgl')
      s.setReady()
      s.notify(tNow('toast.webgl'), { type: 'error' })
    }
    // if the canvas never reports in (zero-size / hidden / stalled GPU), don't keep the page locked
    const bootTimeout = setTimeout(() => {
      if (!useExperience.getState().ready) useExperience.getState().setReady()
    }, 8000)
    // wait for the persisted state to rehydrate before applying a shared build
    const run = () => {
      applySharedBuildFromUrl()
      if (!isStorageOk()) useExperience.getState().notify(tNow('toast.storage'), { type: 'error' })
    }
    let unsub
    if (useExperience.persist?.hasHydrated()) run()
    else unsub = useExperience.persist?.onFinishHydration(run)
    return () => {
      clearTimeout(bootTimeout)
      unsub?.()
    }
  }, [])
}
