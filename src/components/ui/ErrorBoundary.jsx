import { Component } from 'react'
import { useExperience } from '../../store/useExperience'
import { tNow } from '../../lib/i18n'

/**
 * Contains WebGL / scene failures so the rest of the page keeps working.
 * Switches the site into its no-3D presentation and tells the user once.
 */
export default class SceneBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('[scene]', error)
    const s = useExperience.getState()
    s.setWebgl(false)
    document.documentElement.classList.add('no-webgl')
    if (!s.ready) s.setReady()
    s.notify(tNow('toast.sceneError'), { type: 'error' })
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
