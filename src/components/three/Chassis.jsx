import { useMemo } from 'react'
import * as THREE from 'three'
import { DIM, buildGear } from '../../lib/cybertruckGeometry'
import { getMaterials } from '../../lib/materials'

const motorGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.4, 32).rotateX(Math.PI / 2)
const finGeo = new THREE.TorusGeometry(0.175, 0.008, 6, 32)
const shaftGeo = new THREE.CylinderGeometry(0.028, 0.028, 1, 12).rotateX(Math.PI / 2)
const springGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.26, 20)
const damperGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 10)
const armGeo = new THREE.BoxGeometry(0.05, 0.04, 1)

/** One electric drive unit: finned motor can + gearbox with an exposed gear. */
export function Motor({ position, flip = false }) {
  const m = getMaterials()
  const gear = useMemo(() => buildGear(22, 0.13, 0.035, 0.03), [])
  return (
    <group position={position} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh geometry={motorGeo} material={m.alu} castShadow />
      {[-0.12, -0.04, 0.04, 0.12].map((z) => (
        <mesh key={z} geometry={finGeo} material={m.darkMetal} position={[0, 0, z]} />
      ))}
      <mesh material={m.darkMetal} position={[0.2, -0.02, 0]}>
        <boxGeometry args={[0.24, 0.3, 0.3]} />
      </mesh>
      <mesh geometry={gear} material={m.copper} position={[0.2, 0.05, 0.16]} />
      {/* orange HV cable */}
      <mesh material={m.orange} position={[-0.02, 0.19, 0.05]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.022, 0.022, 0.3, 10]} />
      </mesh>
    </group>
  )
}

/** Double-wishbone corner with air spring + damper, between body and wheel. */
export function SuspensionCorner({ x, side }) {
  const m = getMaterials()
  const z0 = side * 0.25
  const z1 = side * (DIM.trackHalf - 0.12)
  const len = Math.abs(z1 - z0)
  const zc = (z0 + z1) / 2
  return (
    <group>
      <mesh geometry={armGeo} material={m.darkMetal} position={[x + 0.12, 0.3, zc]} scale={[1, 1, len]} rotation-y={0.25 * side} />
      <mesh geometry={armGeo} material={m.darkMetal} position={[x - 0.12, 0.3, zc]} scale={[1, 1, len]} rotation-y={-0.25 * side} />
      <mesh geometry={armGeo} material={m.darkMetal} position={[x, 0.62, zc]} scale={[0.8, 0.8, len * 0.85]} />
      <mesh geometry={springGeo} material={m.trim} position={[x, 0.76, side * 0.5]} />
      <mesh geometry={damperGeo} material={m.chrome} position={[x, 0.55, side * 0.5]} />
      {/* knuckle */}
      <mesh material={m.alu} position={[x, DIM.wheelRadius, z1 + side * 0.02]}>
        <boxGeometry args={[0.12, 0.34, 0.06]} />
      </mesh>
    </group>
  )
}

/**
 * The "skateboard": structural battery pack, front motor, rear dual-motor unit,
 * half-shafts and four air-suspended corners. Hidden inside the body until the
 * exploded view lifts the shell away.
 */
export default function Chassis() {
  const m = getMaterials()
  const fx = DIM.wheelBase / 2
  const cells = useMemo(() => {
    const out = []
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) out.push([-1.45 + i * 0.36, -0.54 + j * 0.36])
    return out
  }, [])
  return (
    <group>
      {/* battery pack */}
      <mesh material={m.battery} position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[3.4, 0.14, 1.5]} />
      </mesh>
      {cells.map(([x, z]) => (
        <mesh key={`${x}${z}`} material={m.darkMetal} position={[x, 0.435, z]}>
          <boxGeometry args={[0.32, 0.012, 0.32]} />
        </mesh>
      ))}
      {/* frame rails */}
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} material={m.darkMetal} position={[0, 0.34, z]}>
          <boxGeometry args={[5.0, 0.09, 0.07]} />
        </mesh>
      ))}

      {/* front single motor, rear dual motors */}
      <Motor position={[fx, DIM.wheelRadius, 0]} />
      <Motor position={[-fx, DIM.wheelRadius, -0.22]} flip />
      <Motor position={[-fx, DIM.wheelRadius, 0.22]} flip />

      {/* half-shafts */}
      {[fx, -fx].flatMap((x) =>
        [1, -1].map((s) => (
          <mesh key={`${x}${s}`} geometry={shaftGeo} material={m.chrome} position={[x, DIM.wheelRadius, s * 0.5]} scale={[1, 1, 0.55]} />
        )),
      )}

      {[fx, -fx].flatMap((x) => [1, -1].map((s) => <SuspensionCorner key={`${x}${s}`} x={x} side={s} />))}
    </group>
  )
}
