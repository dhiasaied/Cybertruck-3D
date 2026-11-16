import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Wheel from './Wheel'
import { SuspensionCorner } from './Chassis'
import { DIM, buildGear } from '../../lib/cybertruckGeometry'
import { getMaterials } from '../../lib/materials'
import { SETS, stage } from '../../lib/stage'

/* ------------------------------------------------------------------ */
/* Wheel close-up set                                                  */
/* ------------------------------------------------------------------ */
export function WheelSet() {
  const spin = useRef()
  const cover = useRef()
  const spin2 = useRef()
  useFrame((_, dt) => {
    const a = (spin.current?.rotation.z ?? 0) - dt * stage.wheelSpin * 0.35
    if (spin.current) spin.current.rotation.z = a
    if (spin2.current) spin2.current.rotation.z = a * 0.7
    if (cover.current) {
      cover.current.position.z = stage.cover * 0.9
      cover.current.position.x = -stage.cover * 0.35
      cover.current.rotation.z = stage.cover * 1.4
      cover.current.visible = stage.cover < 0.99
    }
  })
  return (
    <group position={SETS.wheel}>
      {/* hero wheel, slightly yawed toward camera like the reference */}
      <group position={[0, DIM.wheelRadius, 0]} rotation-y={0.35}>
        <Wheel spinRef={spin} coverRef={cover} />
      </group>
      {/* soft second wheel in the background */}
      <group position={[-1.8, DIM.wheelRadius, -2.6]} rotation-y={0.9}>
        <Wheel spinRef={spin2} showCover={false} />
      </group>
      <ShadowFloor />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Drive unit set: rear dual-motor unit, cut away                      */
/* ------------------------------------------------------------------ */
const statorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.36, 48, 1, true, 0.3, Math.PI * 1.45).rotateX(Math.PI / 2)
const endCapGeo = new THREE.CircleGeometry(0.2, 48, 0.3, Math.PI * 1.45)
const coilGeo = new THREE.BoxGeometry(0.03, 0.05, 0.38)
const rotorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.42, 32).rotateX(Math.PI / 2)
const sleeveGeo = new THREE.CylinderGeometry(0.104, 0.104, 0.3, 32, 1, true).rotateX(Math.PI / 2)
const shaftGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 12).rotateX(Math.PI / 2)

function CutawayMotor({ position, flip = 1, rotorRef }) {
  const m = getMaterials()
  const coils = useMemo(() => Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2), [])
  const carbon = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1b1e', roughness: 0.35, metalness: 0.3 }), [])
  return (
    <group position={position} scale={[1, 1, flip]}>
      <mesh geometry={statorGeo} material={m.alu} castShadow />
      <mesh geometry={endCapGeo} material={m.alu} position={[0, 0, -0.18]} rotation-y={Math.PI} />
      {coils.map((a) => (
        <mesh key={a} geometry={coilGeo} material={m.copper} position={[Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0]} rotation-z={a} />
      ))}
      <group ref={rotorRef}>
        <mesh geometry={rotorGeo} material={m.darkMetal} />
        <mesh geometry={sleeveGeo} material={carbon} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} material={m.chrome} position={[Math.cos(i) * 0.104, Math.sin(i) * 0.104, 0]} rotation-z={i}>
            <boxGeometry args={[0.006, 0.02, 0.3]} />
          </mesh>
        ))}
      </group>
      {/* inverter box with orange HV leads */}
      <mesh material={m.darkMetal} position={[0, 0.27, -0.02]}>
        <boxGeometry args={[0.32, 0.12, 0.3]} />
      </mesh>
      {[-0.08, 0, 0.08].map((x) => (
        <mesh key={x} material={m.orange} position={[x, 0.36, -0.1]} rotation-x={0.6}>
          <cylinderGeometry args={[0.016, 0.016, 0.2, 10]} />
        </mesh>
      ))}
    </group>
  )
}

export function DriveSet() {
  const m = getMaterials()
  const gearBig = useMemo(() => buildGear(40, 0.2, 0.045, 0.04), [])
  const gearMid = useMemo(() => buildGear(22, 0.115, 0.045, 0.03), [])
  const gearSmall = useMemo(() => buildGear(14, 0.075, 0.045, 0.02), [])
  const g1 = useRef()
  const g2 = useRef()
  const g3 = useRef()
  const r1 = useRef()
  const r2 = useRef()
  const spinL = useRef()
  const spinR = useRef()
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt * (0.4 + stage.gears)
    const a = t.current
    if (g3.current) g3.current.rotation.z = a * 2.6
    if (g2.current) g2.current.rotation.z = -a * 1.65
    if (g1.current) g1.current.rotation.z = a * 0.9
    if (r1.current) r1.current.rotation.z = a * 2.6
    if (r2.current) r2.current.rotation.z = -a * 2.6
    if (spinL.current) spinL.current.rotation.z = -a * 0.4
    if (spinR.current) spinR.current.rotation.z = -a * 0.4
  })
  const y = DIM.wheelRadius
  return (
    <group position={SETS.drive}>
      <group position={[0, 0.02, 0]}>
        {/* twin cut-away motors */}
        <CutawayMotor position={[0, y, 0.25]} rotorRef={r1} />
        <CutawayMotor position={[0, y, -0.25]} flip={-1} rotorRef={r2} />

        {/* open gear train between them */}
        <group position={[0.22, y + 0.02, 0.48]}>
          <mesh ref={g3} geometry={gearSmall} material={m.chrome} position={[-0.22, 0, 0]} />
          <mesh ref={g2} geometry={gearMid} material={m.copper} position={[-0.03, 0.1, 0]} />
          <mesh ref={g1} geometry={gearBig} material={m.alu} position={[0.24, -0.04, 0]} />
        </group>
        <mesh material={m.darkMetal} position={[0.22, y - 0.05, 0]}>
          <boxGeometry args={[0.38, 0.34, 0.86]} />
        </mesh>

        {/* subframe */}
        {[0.42, -0.42].map((x) => (
          <mesh key={x} material={m.darkMetal} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.07, 0.07, 1.6]} />
          </mesh>
        ))}
        <mesh material={m.darkMetal} position={[0, 0.3, 0.78]}>
          <boxGeometry args={[0.9, 0.07, 0.07]} />
        </mesh>
        <mesh material={m.darkMetal} position={[0, 0.3, -0.78]}>
          <boxGeometry args={[0.9, 0.07, 0.07]} />
        </mesh>

        {/* half-shafts + suspension corners + wheels */}
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh geometry={shaftGeo} material={m.chrome} position={[0.22, y, s * 0.68]} scale={[1, 1, 0.42]} />
            <SuspensionCorner x={0} side={s} />
            <group position={[0, y, s * DIM.trackHalf]}>
              <Wheel mirrored={s < 0} spinRef={s > 0 ? spinR : spinL} showCover={false} />
            </group>
          </group>
        ))}
      </group>
      <ShadowFloor />
    </group>
  )
}

/** Shadow-catching floor (transparent; only the shadow shows). */
export function ShadowFloor({ size = 30, opacity = 0.22 }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <shadowMaterial transparent opacity={opacity} />
    </mesh>
  )
}
