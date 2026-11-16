import { useExperience } from '../store/useExperience'
import { FINISHES, PALETTES } from './presets'
import { tNow } from './i18n'

/**
 * User actions shared by the nav, search palette, keyboard shortcuts,
 * configurator and garage — one implementation, consistent feedback.
 */
const S = () => useExperience.getState()

export function toggleTheme() {
  const next = S().theme === 'dark' ? 'light' : 'dark'
  S().setTheme(next)
  S().notify(tNow(`toast.theme.${next}`))
}

export function toggleLang() {
  const next = S().lang === 'en' ? 'fr' : 'en'
  S().setLang(next)
  S().notify(tNow('toast.lang'))
}

export function toggleUnits() {
  const next = S().units === 'us' ? 'metric' : 'us'
  S().setUnits(next)
  S().notify(tNow(`toast.units.${next}`))
}

/** Human name for a build, e.g. "Stainless Steel · Graphite". */
export function buildName({ finishId, paletteId }) {
  const f = FINISHES.find((x) => x.id === finishId) ? tNow(`finishes.${finishId}`) : finishId
  const p = PALETTES.find((x) => x.id === paletteId) ? tNow(`palettes.${paletteId}`) : paletteId
  return `${f} · ${p}`
}

export function saveCurrentBuild() {
  const s = S()
  const b = s.saveBuild(buildName(s))
  s.notify(tNow('toast.buildSaved', { name: b.name }), { type: 'success' })
  return b
}

/** Deletes after confirmation, with an Undo action on the toast. */
export async function deleteBuild(b) {
  const ok = await S().confirm({
    title: tNow('garage.confirmDelete', { name: b.name }),
    body: tNow('garage.confirmDeleteBody'),
    confirmLabel: tNow('common.delete'),
    danger: true,
  })
  if (!ok) return
  S().deleteBuild(b.id)
  S().notify(tNow('toast.buildDeleted'), { action: { label: tNow('undo'), run: () => S().restoreBuild(b) } })
}

export async function clearBookmarks() {
  const n = S().bookmarks.length
  if (!n) return
  const ok = await S().confirm({
    title: tNow('garage.confirmClear'),
    body: tNow('garage.confirmClearBody', { n }),
    confirmLabel: tNow('common.clearAll'),
    danger: true,
  })
  if (!ok) return
  const prev = S().bookmarks
  S().clearBookmarks()
  S().notify(tNow('toast.cleared'), { action: { label: tNow('undo'), run: () => useExperience.setState({ bookmarks: prev }) } })
}

export function toggleBookmark(item) {
  const added = S().toggleBookmark(item)
  S().notify(tNow(added ? 'toast.bookmarked' : 'toast.unbookmarked'), { type: added ? 'success' : 'info' })
}

/* ---- share links: ?finish=…&palette=…&color=… ---- */
export function buildUrl(b = S()) {
  const u = new URL(window.location.href)
  u.hash = ''
  u.search = ''
  u.searchParams.set('finish', b.finishId)
  u.searchParams.set('palette', b.paletteId)
  if (b.finishId === 'custom') u.searchParams.set('color', b.customColor.replace('#', ''))
  return u.toString()
}

export async function shareBuild(b) {
  const url = buildUrl(b)
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: 'Cybertruck', text: buildName(b ?? S()), url })
      return
    }
    await navigator.clipboard.writeText(url)
    S().notify(tNow('toast.linkCopied'), { type: 'success' })
  } catch (e) {
    if (e?.name === 'AbortError') return // user dismissed the share sheet
    S().notify(tNow('toast.copyFailed'), { type: 'error' })
  }
}

/** Apply a build passed in the URL, then clean the address bar. */
export function applySharedBuildFromUrl() {
  const p = new URLSearchParams(window.location.search)
  const finishId = p.get('finish')
  const paletteId = p.get('palette')
  if (!finishId && !paletteId) return
  const s = S()
  const next = {
    finishId: FINISHES.some((f) => f.id === finishId) ? finishId : s.finishId,
    paletteId: PALETTES.some((x) => x.id === paletteId) ? paletteId : s.paletteId,
    customColor: /^[0-9a-f]{6}$/i.test(p.get('color') || '') ? `#${p.get('color')}` : s.customColor,
  }
  s.applyBuild(next)
  s.notify(tNow('toast.sharedBuild', { name: buildName(next) }), { type: 'success' })
  window.history.replaceState(null, '', window.location.pathname)
}
