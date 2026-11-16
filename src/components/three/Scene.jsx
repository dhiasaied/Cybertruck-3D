import { useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import { useExperience } from '../../store/useExperience'
import { QUALITY } from '../../lib/device'

/**
 * Views render with autoClear off into their own scissor rects, so the
 * transparent areas between them must be wiped once per frame.
 */
function Clearer() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false)
    gl.setClearColor(0x000000, 0)
    gl.clear(true, true, true)
  }, 0)
  return null
}

function ReadySignal() {
  const setReady = useExperience((s) => s.setReady)
  useEffect(() => {
    // timeout (not rAF) so a background tab still finishes booting
    const id = setTimeout(setReady, 250)
    return () => clearTimeout(id)
  }, [setReady])
  return null
}

/**
 * One fixed, transparent WebGL canvas behind the whole page. Every 3D surface
 * (hero stage + gallery cards) is a drei <View> that tracks a DOM element and is
 * scissor-rendered here — one GL context, many cameras.
 */
export default function Scene() {
  const quality = useExperience((s) => s.quality)
  return (
    <Canvas
      className="webgl"
      shadows
      dpr={QUALITY[quality].dpr}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <Clearer />
      <View.Port />
      <ReadySignal />
    </Canvas>
  )
}
