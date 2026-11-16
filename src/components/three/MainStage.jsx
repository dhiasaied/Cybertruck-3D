import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Cybertruck from './Cybertruck'
import { DriveSet, WheelSet, ShadowFloor } from './Sets'
import { SceneEnv } from './common'
import { stage, CARDS } from '../../lib/stage'
import { overlay } from '../../lib/overlay'
import { pointer, spin, reducedMotion } from '../../lib/interaction'

const DARK = new THREE.Color('#0a0d18')
const BLUSH = new THREE.Color('#d7c5c3')
const STUDIO = new THREE.Color('#ecebe8')
const tmp = new THREE.Color()
const v = new THREE.Vector3()
const right = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const par = { x: 0, y: 0 }
const ANCHOR_CARDS = Object.entries(CARDS).filter(([, c]) => c.anchor)

/** Giant hairline "CYBERTRUCK" that sits behind the truck (drawn to a canvas texture). */
function OutlineWord() {
  const mat = useRef()
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 2048
    c.height = 360
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    const draw = () => {
      const ctx = c.getContext('2d')
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.font = '200 300px Inter, Helvetica, Arial, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 2.2
      ctx.strokeStyle = 'rgba(40,40,44,0.55)'
      ctx.strokeText('CYBERTRUCK', 20, c.height / 2)
      t.needsUpdate = true
    }
    draw()
    document.fonts?.ready.then(draw)
    return t
  }, [])
  useFrame(() => {
    if (mat.current) mat.current.opacity = stage.outline * stage.studio
  })
  return (
    <mesh position={[-1.2, 3.3, -7]} renderOrder={-1}>
      <planeGeometry args={[17, 17 * (360 / 2048)]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * The hero "Anatomy" scene, rendered into the sticky stage element through a
 * drei <View>. Everything is driven by the shared `stage` object.
 */
export default function MainStage() {
  const cam = useRef()
  const truck = useRef()
  const sun = useRef()
  const amb = useRef()
  const scene = useThree((s) => s.scene)
  const pose = useMemo(() => ({ explode: 0, doors: 0, frunk: 0, tonneau: 0, lights: 0, beams: 0, cover: 0, spin: 0 }), [])
  const look = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    scene.background = DARK.clone()
  }, [scene])

  useFrame((state, dt) => {
    const s = stage
    const still = reducedMotion()

    // ---- drag-to-rotate: inertia while released, then glide back to the scripted pose
    if (!spin.dragging) {
      spin.yaw += spin.vel * dt
      spin.vel *= Math.exp(-4 * dt)
      if (Math.abs(spin.vel) < 0.08) spin.yaw = THREE.MathUtils.damp(spin.yaw, 0, 1.1, dt)
    }
    // ---- smoothed pointer parallax
    par.x = THREE.MathUtils.damp(par.x, still ? 0 : pointer.x, 2.5, dt)
    par.y = THREE.MathUtils.damp(par.y, still ? 0 : pointer.y, 2.5, dt)
    // ---- camera
    const c = cam.current
    if (c) {
      look.set(s.lookX, s.lookY, s.lookZ)
      c.position.set(s.camX, s.camY, s.camZ)
      // portrait / narrow screens: dolly out along the view ray so the 5.7 m truck still fits
      const fit = c.aspect < 1.3 ? 1 + (1.3 - c.aspect) * 1.25 : 1
      if (fit !== 1) c.position.sub(look).multiplyScalar(fit).add(look)
      // subtle hand-held parallax along the camera's own right/up axes
      const dist = c.position.distanceTo(look)
      right.subVectors(look, c.position).cross(UP).normalize()
      c.position.addScaledVector(right, par.x * dist * 0.022).addScaledVector(UP, par.y * dist * 0.012)
      c.lookAt(look)
      if (Math.abs(c.fov - s.fov) > 0.01) {
        c.fov = s.fov
        c.updateProjectionMatrix()
      }
    }
    // ---- dark garage → blush → white studio
    const k = s.studio
    if (k < 0.5) tmp.copy(DARK).lerp(BLUSH, k * 2)
    else tmp.copy(BLUSH).lerp(STUDIO, (k - 0.5) * 2)
    scene.background.copy(tmp)
    scene.environmentIntensity = 0.06 + k * 0.94
    // slow studio light sweep: rotating the environment drags highlights across the steel
    if (scene.environmentRotation) scene.environmentRotation.y = still ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.55 + par.x * 0.25
    if (sun.current) {
      sun.current.intensity = 0.15 + k * 1.6
      sun.current.position.set(s.lookX + 4, s.lookY + 9, s.lookZ + 5)
      sun.current.target.position.set(s.lookX, 0, s.lookZ)
      sun.current.target.updateMatrixWorld()
    }
    if (amb.current) amb.current.intensity = 0.05 + k * 0.35

    // ---- truck pose
    if (truck.current) truck.current.rotation.y = s.rotY + spin.yaw
    pose.explode = s.explode
    pose.doors = s.doors
    pose.frunk = s.frunk
    pose.tonneau = s.tonneau
    pose.lights = s.lights
    pose.beams = s.beams

    // ---- leader line from the active callout card to its point on the truck
    const path = overlay.linePath
    if (!path || !overlay.stageEl || !truck.current || !c) return
    let best = null
    let bestA = 0
    for (const [id, card] of ANCHOR_CARDS) {
      const el = overlay.cards[id]
      const a = el ? parseFloat(el.style.opacity || '0') : 0
      if (a > bestA) {
        bestA = a
        best = { el, card }
      }
    }
    if (!best || bestA < 0.02) {
      path.style.opacity = 0
      if (overlay.lineDot) overlay.lineDot.style.opacity = 0
      return
    }
    v.set(...best.card.anchor)
    truck.current.localToWorld(v)
    v.project(c)
    const r = overlay.stageEl.getBoundingClientRect()
    const ax = ((v.x + 1) / 2) * r.width
    const ay = ((1 - v.y) / 2) * r.height
    const cr = best.el.getBoundingClientRect()
    const x0 = cr.right - r.left
    const y0 = cr.top - r.top + 22
    path.setAttribute('d', `M ${x0} ${y0} H ${ax} V ${ay}`)
    path.style.opacity = bestA
    if (overlay.lineDot) {
      overlay.lineDot.setAttribute('cx', ax)
      overlay.lineDot.setAttribute('cy', ay)
      overlay.lineDot.style.opacity = bestA
    }
  })

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault fov={30} near={0.1} far={200} position={[0, 0.95, 9.2]} />
      <SceneEnv />
      <ambientLight ref={amb} intensity={0.05} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={0.2}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-far={40}
        shadow-bias={-0.0003}
      />

      {/* cool rim light from behind for edge separation on the white cyclorama */}
      <spotLight position={[-6, 5, -7]} angle={0.6} penumbra={1} intensity={45} distance={30} color="#e8eeff" />
      <OutlineWord />
      <group ref={truck}>
        <Cybertruck pose={pose} />
      </group>
      <ShadowFloor opacity={0.18} />
      <ContactShadows position={[0, 0.002, 0]} scale={[14, 14]} resolution={1024} blur={2.6} far={3} opacity={0.6} />

      <WheelSet />
      <DriveSet />
    </>
  )
}
