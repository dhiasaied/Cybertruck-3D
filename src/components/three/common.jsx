import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { getStudioEnv } from '../../lib/studioEnv'

/** Applies the shared procedural studio HDRI to the (portal) scene it is mounted in. */
export function SceneEnv({ intensity = 1 }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.environment = getStudioEnv(gl)
    scene.environmentIntensity = intensity
  }, [gl, scene, intensity])
  return null
}
