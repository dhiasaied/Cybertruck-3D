import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DIM, buildAeroCover } from '../../lib/cybertruckGeometry'
import { getMaterials } from '../../lib/materials'

const R = DIM.wheelRadius
// open carcass + ring sidewalls, so the rim and brake are visible through the wheel face
const tireGeo = new THREE.CylinderGeometry(R, R, 0.3, 64, 1, true).rotateX(Math.PI / 2)
const sidewallGeo = new THREE.RingGeometry(0.295, R - 0.01, 64)
const shoulderGeo = new THREE.TorusGeometry(R - 0.035, 0.04, 12, 64)
const rimBarrel = new THREE.CylinderGeometry(0.3, 0.3, 0.29, 48, 1, true).rotateX(Math.PI / 2)
const rimLip = new THREE.TorusGeometry(0.3, 0.012, 8, 48)
const treadGeo = new THREE.BoxGeometry(0.05, 0.022, 0.26)
const sipeGeo = new THREE.BoxGeometry(0.03, 0.022, 0.12)
const spokeGeo = new THREE.BoxGeometry(0.05, 0.25, 0.04)
const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.028, 48).rotateX(Math.PI / 2)
const hatGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 32).rotateX(Math.PI / 2)
const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 6).rotateX(Math.PI / 2)
const coverGeo = buildAeroCover(0.29)
const TREADS = 30

/**
 * 35" all-terrain wheel: aggressive tread blocks (instanced), shoulder lugs,
 * multi-spoke rim, drilled brake disc + caliper, and the hexagonal aero cover
 * which can pop off (`coverRef`) for the component close-up.
 */
export default function Wheel({ spinRef, coverRef, mirrored = false, showCover = true, ...props }) {
  const m = getMaterials()
  const treads = useRef()
  const sipes = useRef()

  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    for (let i = 0; i < TREADS; i++) {
      const a = (i / TREADS) * Math.PI * 2
      o.position.set(Math.cos(a) * (R + 0.006), Math.sin(a) * (R + 0.006), 0)
      o.rotation.set(0, 0, a + Math.PI / 2)
      o.updateMatrix()
      treads.current.setMatrixAt(i, o.matrix)
      // staggered shoulder lugs
      o.position.set(Math.cos(a + 0.1) * (R - 0.02), Math.sin(a + 0.1) * (R - 0.02), (i % 2 ? 1 : -1) * 0.16)
      o.updateMatrix()
      sipes.current.setMatrixAt(i, o.matrix)
    }
    treads.current.instanceMatrix.needsUpdate = true
    sipes.current.instanceMatrix.needsUpdate = true
  }, [])

  const spokes = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), [])

  return (
    <group {...props} scale={[1, 1, mirrored ? -1 : 1]}>
      {/* brake (does not spin) */}
      <mesh geometry={discGeo} material={m.disc} position={[0, 0, 0.0]} />
      <mesh geometry={hatGeo} material={m.alu} position={[0, 0, 0.03]} />
      <mesh material={m.caliper} position={[0.17, 0.12, 0.035]} rotation-z={0.6}>
        <boxGeometry args={[0.1, 0.2, 0.08]} />
      </mesh>

      <group ref={spinRef}>
        <mesh geometry={tireGeo} material={m.rubberDouble} castShadow />
        <mesh geometry={sidewallGeo} material={m.rubberDouble} position={[0, 0, 0.15]} />
        <mesh geometry={sidewallGeo} material={m.rubberDouble} position={[0, 0, -0.15]} />
        <mesh geometry={shoulderGeo} material={m.rubber} position={[0, 0, 0.13]} />
        <mesh geometry={shoulderGeo} material={m.rubber} position={[0, 0, -0.13]} />
        <instancedMesh ref={treads} args={[treadGeo, m.rubber, TREADS]} />
        <instancedMesh ref={sipes} args={[sipeGeo, m.rubber, TREADS]} />
        <mesh geometry={rimBarrel} material={m.rim} />
        <mesh geometry={rimLip} material={m.rim} position={[0, 0, 0.14]} />
        {spokes.map((a) => (
          <mesh key={a} geometry={spokeGeo} material={m.rim} position={[Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.11]} rotation-z={a - Math.PI / 2} />
        ))}
        <mesh geometry={hubGeo} material={m.chrome} position={[0, 0, 0.12]} />
        {showCover && (
          <group ref={coverRef}>
            <mesh geometry={coverGeo} material={m.cover} position={[0, 0, 0.15]} />
            <mesh position={[0, 0, 0.185]} rotation-x={Math.PI / 2} material={m.chrome}>
              <cylinderGeometry args={[0.065, 0.065, 0.02, 24]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}
