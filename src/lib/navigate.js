import { goTo, goToY } from '../components/ui/Transition'
import { SHOTS } from './stage'
import { tNow } from './i18n'
import { specKey } from './specs'

/**
 * Deep navigation shared by search results, garage bookmarks and buttons.
 * Sections listen for `ct:focus` events to highlight what was asked for.
 */
export const focusEvent = (detail) => window.dispatchEvent(new CustomEvent('ct:focus', { detail }))

export const SECTION_IDS = ['anatomy', 'overview', 'highlights', 'power', 'motors', 'estimator', 'technical']

export function openSection(id) {
  goTo(id, tNow(`sections.${id}`).split(' — ')[0])
}

/** Jump straight into the teardown film at a given shot. */
export function openChapter(shotIndex) {
  const sec = document.getElementById('anatomy')
  if (!sec) return
  const y = sec.getBoundingClientRect().top + window.scrollY + shotIndex * window.innerHeight
  goToY(y, tNow(`chapters.${SHOTS[shotIndex].id}`))
}

export function openHighlight(key) {
  goTo('highlights', tNow('nav.highlights'), () => focusEvent({ kind: 'highlight', key }))
}

export function openFeature(key) {
  goTo('power', tNow('sections.power'), () => focusEvent({ kind: 'feature', key }))
}

export function openSpec(key) {
  goTo('technical', tNow('nav.technical'), () => focusEvent({ kind: 'spec', key }))
}

/** Bookmarks are `{ id: 'kind:key', kind, key }`. */
export function openBookmark(b) {
  if (b.kind === 'highlight') openHighlight(b.key)
  else if (b.kind === 'feature') openFeature(b.key)
  else if (b.kind === 'spec') openSpec(b.key)
}

export function bookmarkTitle(b, t, units = 'us') {
  if (b.kind === 'highlight') return t(`highlights.items.${b.key}.title`)
  if (b.kind === 'feature') return t(`power.features.${b.key}.title`)
  if (b.kind === 'spec') return t(specKey(b.key, units))
  return b.id
}
