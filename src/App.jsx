import { lazy, Suspense } from 'react'
import Anatomy from './components/ui/Anatomy'
import Showcase from './components/ui/Showcase'
import Customizer from './components/ui/Customizer'
import Cursor from './components/ui/Cursor'
import Transition from './components/ui/Transition'
import SceneBoundary from './components/ui/ErrorBoundary'
import { Backdrop, Loader, Nav, ScrollPill } from './components/ui/Chrome'
import { ConfirmDialog, Toasts } from './components/ui/Overlays'
import { Garage, Help, SearchPalette } from './components/ui/Panels'
import { useFinishMorph, useThemeVars } from './hooks/useThemeVars'
import { useBootChecks, useDocumentPrefs, useShortcuts } from './hooks/useAppEffects'
import { useExperience } from './store/useExperience'
import { useT } from './lib/i18n'

// The WebGL host canvas is code-split; DOM + layout paint first.
const Scene = lazy(() => import('./components/three/Scene'))

export default function App() {
  useThemeVars()
  useFinishMorph()
  useDocumentPrefs()
  useShortcuts()
  useBootChecks()
  const webgl = useExperience((s) => s.webgl)
  const t = useT()
  return (
    <>
      <a className="skip" href="#highlights">
        {t('skip')}
      </a>
      <Backdrop />
      {webgl && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </SceneBoundary>
      )}
      <Nav />
      <main id="main">
        <Anatomy />
        <Showcase />
      </main>
      <ScrollPill />
      <Customizer />
      <Garage />
      <SearchPalette />
      <Help />
      <ConfirmDialog />
      <Toasts />
      <Transition />
      <Cursor />
      <Loader />
    </>
  )
}
