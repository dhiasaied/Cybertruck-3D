import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerspectiveCamera, View } from '@react-three/drei'
import * as THREE from 'three'
import Cybertruck, { CLOSED_POSE } from './Cybertruck'
import { SceneEnv } from './common'
import { canHover, reducedMotion } from '../../lib/interaction'

function Background({ color }) {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.background = new THREE.Color(color)
  }, [scene, color])
  return null
}

const tmpLook = new THREE.Vector3()
const tmpPos = new THREE.Vector3()

/**
 * Camera + truck that respond to the card's hover state:
 *   hover → the truck turns toward the pointer, the camera eases in a touch,
 *           and the studio reflections slide across the panels.
 * On touch devices (no hover) the truck sways gently instead.
 */
function Rig({ cam, look, fov, rotY, pose, hover }) {
  const camRef = useRef()
  const truck = useRef()
  const scene = useThree((s) => s.scene)
  const base = useMemo(() => new THREE.Vector3(...cam), [cam])
  const target = useMemo(() => new THREE.Vector3(...look), [look])
  const touch = useMemo(() => !canHover(), [])
  const still = useMemo(() => reducedMotion(), [])
  const h = useRef({ k: 0, x: 0, y: 0 })

  useFrame((state, dt) => {
    const st = hover.current
    const g = h.current
    g.k = THREE.MathUtils.damp(g.k, st.active ? 1 : 0, 4, dt)
    g.x = THREE.MathUtils.damp(g.x, st.active ? st.x : 0, 5, dt)
    g.y = THREE.MathUtils.damp(g.y, st.active ? st.y : 0, 5, dt)
    const t = state.clock.elapsedTime
    const sway = touch && !still ? Math.sin(t * 0.5) * 0.08 : 0
    if (truck.current) truck.current.rotation.y = rotY + g.x * 0.28 + sway
    if (camRef.current) {
      // dolly 7% toward the subject + slight vertical parallax
      tmpPos.copy(base).sub(target).multiplyScalar(1 - g.k * 0.07).add(target)
      tmpPos.y += g.y * 0.25
      camRef.current.position.copy(tmpPos)
      tmpLook.copy(target)
      camRef.current.lookAt(tmpLook)
    }
    if (scene.environmentRotation) scene.environmentRotation.y = g.x * 0.6 + (still ? 0 : Math.sin(t * 0.1) * 0.25)
  })

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault position={cam} fov={fov} near={0.1} far={80} />
      <group ref={truck} rotation-y={rotY}>
        <Cybertruck pose={pose} chassis={false} />
      </group>
    </>
  )
}

/**
 * A "photograph" in the dark sections — a live 3D render scissored into the
 * card's DOM rect via drei <View>. `hover` is a ref owned by the DOM card.
 */
export default function ShowcaseView({
  className,
  cam = [8, 2, 8],
  look = [0, 0.9, 0],
  fov = 30,
  rotY = 0,
  pose,
  bg = '#e9e8e5',
  dark = false,
  hover,
  ...props
}) {
  const fallback = useRef({ active: false, x: 0, y: 0 })
  const p = useMemo(() => ({ ...CLOSED_POSE, lights: dark ? 1 : 0.6, ...pose }), [pose, dark])
  return (
    <View className={className} {...props}>
      <Background color={bg} />
      <SceneEnv intensity={dark ? 0.35 : 1} />
      <ambientLight intensity={dark ? 0.04 : 0.3} />
      <directionalLight position={[4, 9, 5]} intensity={dark ? 0.4 : 1.4} />
      <spotLight position={[-6, 5, -6]} intensity={dark ? 70 : 30} angle={0.55} penumbra={1} color="#eef2ff" />
      <Rig cam={cam} look={look} fov={fov} rotY={rotY} pose={p} hover={hover ?? fallback} />
      <ContactShadows position={[0, 0.002, 0]} scale={[12, 12]} resolution={512} blur={2.4} far={2.6} opacity={dark ? 0.9 : 0.55} frames={1} />
    </View>
  )
}
