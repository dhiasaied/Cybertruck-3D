import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  DIM,
  DOORS,
  buildArchTrim,
  buildDoor,
  buildFrunk,
  buildLowerBody,
  buildRoofGlass,
  buildTonneau,
  buildUpperBody,
  buildWindshield,
  createRadialTexture,
} from '../../lib/cybertruckGeometry'
import { getMaterials } from '../../lib/materials'
import Wheel from './Wheel'
import Chassis from './Chassis'

/* Geometry is identical for every instance → build once per page. */
let G = null
function getGeometry() {
  if (G) return G
  const fx = DIM.wheelBase / 2
  G = {
    lower: buildLowerBody(),
    upper: buildUpperBody(),
    windshield: buildWindshield(),
    roofGlass: buildRoofGlass(),
    archF: buildArchTrim(fx),
    archR: buildArchTrim(-fx),
    doors: [1, -1].flatMap((side) => DOORS.map((d) => ({ ...buildDoor(d, side), side, id: `${d.id}${side}` }))),
    frunk: buildFrunk(),
    tonneau: buildTonneau(),
    glow: createRadialTexture(),
  }
  return G
}

/** Default pose for static showcase instances. */
export const CLOSED_POSE = { explode: 0, doors: 0, frunk: 0, tonneau: 0, lights: 1, cover: 0, spin: 0, beams: 0 }

/**
 * Tesla Cybertruck — procedural, real-world scale (5.68 m).
 *
 * `pose` is a plain mutable object (tweened by GSAP from outside):
 *   explode  0..1  body shell lifts off the skateboard, wheels slide out
 *   doors    0..1  all four doors swing open on their front hinges
 *   frunk    0..1  frunk lid tilts up
 *   tonneau  0..1  vault cover retracts into the tailgate
 *   lights   0..1  light bar / tail bar intensity
 *   beams    0..1  volumetric headlight beams (intro shot)
 *   cover    0..1  aero covers pop off the wheels
 *   spin     rad   wheel rotation
 */
export default function Cybertruck({ pose = CLOSED_POSE, chassis = true, ...props }) {
  const g = getGeometry()
  const m = getMaterials()
  const fx = DIM.wheelBase / 2
  const W = DIM.halfWidth

  // per-instance emissive materials (lights can differ per view)
  const fx_ = useMemo(
    () => ({
      bar: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff'), toneMapped: false }),
      tail: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff1e1e'), toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({
        map: g.glow,
        color: '#dfe9ff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      beam: new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `varying vec2 vUv; uniform float uOpacity;
          void main(){ float a = pow(vUv.y, 2.2) * (1.0 - abs(vUv.x - 0.5) * 1.6);
          gl_FragColor = vec4(vec3(0.82, 0.88, 1.0), a * uOpacity * 0.22); }`,
      }),
    }),
    [g.glow],
  )

  const body = useRef()
  const tonneauRef = useRef()
  const tonneauLift = useRef()
  const frunkRef = useRef()
  const doorRefs = useRef([])
  const wheelRefs = [useRef(), useRef(), useRef(), useRef()]
  const spinRefs = [useRef(), useRef(), useRef(), useRef()]
  const coverRefs = [useRef(), useRef(), useRef(), useRef()]
  const beamRef = useRef()

  useFrame(() => {
    const p = pose
    const e = THREE.MathUtils.smootherstep(p.explode, 0, 1)
    if (body.current) body.current.position.y = e * 1.35
    if (tonneauLift.current) tonneauLift.current.position.y = e * 0.85
    if (tonneauRef.current) tonneauRef.current.scale.x = 1 - p.tonneau * 0.96
    if (frunkRef.current) frunkRef.current.rotation.z = p.frunk * 0.95
    doorRefs.current.forEach((d, i) => {
      if (!d) return
      const side = g.doors[i].side
      d.rotation.y = side * p.doors * (g.doors[i].id.startsWith('front') ? 1.05 : 0.95)
    })
    wheelRefs.forEach((w, i) => {
      if (!w.current) return
      const side = i < 2 ? 1 : -1
      const front = i % 2 === 0 ? 1 : -1
      w.current.position.z = side * (DIM.trackHalf + e * 0.55)
      w.current.position.x = front * (fx + e * 0.25)
    })
    spinRefs.forEach((s) => s.current && (s.current.rotation.z = p.spin))
    coverRefs.forEach((c) => {
      if (!c.current) return
      c.current.position.z = p.cover * 0.6
      c.current.rotation.z = p.cover * 1.2
      c.current.visible = p.cover < 0.98
    })
    fx_.bar.color.setScalar(0.25 + p.lights * 3.2)
    fx_.tail.color.setRGB(0.25 + p.lights * 3, 0.02, 0.02)
    fx_.glow.opacity = p.beams * 0.9
    fx_.beam.uniforms.uOpacity.value = p.beams
    if (beamRef.current) beamRef.current.visible = p.beams > 0.01
  })

  return (
    <group {...props}>
      {/* =========================== BODY SHELL =========================== */}
      <group ref={body}>
        <mesh geometry={g.lower} material={m.body} castShadow receiveShadow />
        <mesh geometry={g.upper} material={m.body} castShadow receiveShadow />
        <mesh geometry={g.windshield} material={m.glass} />
        <mesh geometry={g.roofGlass} material={m.glass} />

        {/* fender trims + rocker cladding */}
        <mesh geometry={g.archF} material={m.trim} position={[0, 0, W - 0.005]} />
        <mesh geometry={g.archR} material={m.trim} position={[0, 0, W - 0.005]} />
        <mesh geometry={g.archF} material={m.trim} position={[0, 0, -W - 0.03]} />
        <mesh geometry={g.archR} material={m.trim} position={[0, 0, -W - 0.03]} />
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh material={m.trim} position={[0, 0.47, s * (W + 0.012)]}>
              <boxGeometry args={[fx * 2 - 1.48, 0.1, 0.03]} />
            </mesh>
            {/* side camera-mirror */}
            <group position={[1.78, 1.16, s * (W + 0.06)]}>
              <mesh material={m.trim} rotation-y={s * 0.25}>
                <boxGeometry args={[0.2, 0.09, 0.14]} />
              </mesh>
              <mesh material={m.glass} position={[-0.101, 0, 0]} rotation-y={Math.PI / 2}>
                <planeGeometry args={[0.12, 0.07]} />
              </mesh>
              <mesh material={m.trim} position={[0.02, -0.05, -s * 0.05]}>
                <boxGeometry args={[0.04, 0.06, 0.06]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* doors: dark opening behind each, panel + frame + glass on a hinge */}
        {g.doors.map((d, i) => (
          <group key={d.id}>
            <mesh geometry={d.holeLower} material={m.hole} />
            <mesh geometry={d.holeUpper} material={m.hole} />
            <group position={d.hinge} ref={(el) => (doorRefs.current[i] = el)}>
              <mesh geometry={d.lower} material={m.body} castShadow />
              <mesh geometry={d.upper} material={m.bodyDouble} />
              <mesh geometry={d.glass} material={m.glass} />
            </group>
          </group>
        ))}
        {/* simple cabin: seats + dash visible through open doors */}
        <group>
          {[0.45, -0.55].map((x) => (
            <group key={x}>
              {[0.42, -0.42].map((z) => (
                <group key={z} position={[x, 0.95, z]}>
                  <mesh material={m.interior}>
                    <boxGeometry args={[0.5, 0.12, 0.5]} />
                  </mesh>
                  <mesh material={m.interior} position={[-0.25, 0.32, 0]} rotation-z={0.15}>
                    <boxGeometry args={[0.1, 0.62, 0.48]} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
          <mesh material={m.trim} position={[1.25, 1.15, 0]}>
            <boxGeometry args={[0.4, 0.08, 1.8]} />
          </mesh>
          <mesh material={m.glass} position={[1.08, 1.27, 0]} rotation-z={-0.4}>
            <boxGeometry args={[0.01, 0.26, 0.42]} />
          </mesh>
        </group>

        {/* frunk */}
        <mesh geometry={g.frunk.hole} material={m.hole} />
        <group position={[g.frunk.hinge.x, g.frunk.hinge.y, 0]} ref={frunkRef}>
          <mesh geometry={g.frunk.lid} material={m.bodyDouble} castShadow />
        </group>

        {/* vault / tonneau (retracts toward tailgate, lifts in exploded view) */}
        <mesh geometry={g.tonneau.hole} material={m.hole} />
        <group ref={tonneauLift}>
          <group position={[g.tonneau.origin.x, g.tonneau.origin.y, 0]} rotation-z={g.tonneau.angle}>
            <group ref={tonneauRef}>
              <mesh geometry={g.tonneau.lid} material={m.trim} castShadow />
              {/* slats */}
              {Array.from({ length: 12 }, (_, i) => (
                <mesh key={i} material={m.darkMetal} position={[0.12 + i * (g.tonneau.length / 12.4), 0.012, 0]}>
                  <boxGeometry args={[0.006, 0.004, 1.7]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* front light bar + lower bumper */}
        <mesh material={fx_.bar} position={[DIM.tip.x + 0.004, DIM.tip.y - 0.012, 0]}>
          <boxGeometry args={[0.02, 0.026, W * 2 * 0.97]} />
        </mesh>
        <mesh material={m.trim} position={[2.79, 0.52, 0]} rotation-z={0.23}>
          <boxGeometry args={[0.05, 0.18, W * 2 * 0.92]} />
        </mesh>
        {[0.62, -0.62].map((z) => (
          <mesh key={z} material={m.darkMetal} position={[2.8, 0.47, z]}>
            <boxGeometry args={[0.06, 0.05, 0.12]} />
          </mesh>
        ))}

        {/* rear: tail light bar, tailgate seam, bumper */}
        <mesh material={fx_.tail} position={[DIM.tail.x - 0.006, DIM.tail.y - 0.035, 0]}>
          <boxGeometry args={[0.02, 0.032, 1.86]} />
        </mesh>
        <mesh material={m.trim} position={[DIM.tail.x - 0.004, 0.64, 0]}>
          <boxGeometry args={[0.012, 0.012, 1.9]} />
        </mesh>
        <mesh material={m.trim} position={[-2.81, 0.5, 0]} rotation-z={-0.4}>
          <boxGeometry args={[0.05, 0.17, 1.9]} />
        </mesh>

        {/* intro: light-bar bloom + volumetric beams */}
        <mesh material={fx_.glow} position={[DIM.tip.x + 0.06, DIM.tip.y, 0]} rotation-y={Math.PI / 2} renderOrder={5}>
          <planeGeometry args={[3.4, 0.9]} />
        </mesh>
        <group ref={beamRef} position={[DIM.tip.x + 0.02, DIM.tip.y - 0.01, 0]}>
          {[0.55, -0.55].map((z) => (
            <mesh key={z} material={fx_.beam} position={[3.2, -0.38, z]} rotation-z={Math.PI / 2 + 0.13} renderOrder={4}>
              <coneGeometry args={[1.25, 6.4, 32, 1, true]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================= SKATEBOARD ============================= */}
      {chassis && <Chassis />}

      {/* ============================ WHEELS ============================== */}
      {[
        [fx, 1],
        [-fx, 1],
        [fx, -1],
        [-fx, -1],
      ].map(([x, s], i) => (
        <group key={i} ref={wheelRefs[i]} position={[x, DIM.wheelRadius, s * DIM.trackHalf]}>
          <Wheel mirrored={s < 0} spinRef={spinRefs[i]} coverRef={coverRefs[i]} />
        </group>
      ))}
    </group>
  )
}
