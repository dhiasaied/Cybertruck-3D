import * as THREE from 'three'

/**
 * Procedural photo-studio environment (HDRI substitute), baked once with PMREM
 * and shared by every view. Bright cyclorama walls, a darker floor, and strip
 * softboxes that draw the long crisp highlights across the stainless panels.
 * Nothing is downloaded — the whole "HDRI" is generated on the GPU.
 */
let cached = null

export function getStudioEnv(renderer) {
  if (cached) return cached
  const scene = new THREE.Scene()

  // gradient cyclorama sphere
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 floorC = vec3(0.18, 0.18, 0.19);
          vec3 horizon = vec3(0.95, 0.94, 0.93);
          vec3 top = vec3(1.25, 1.24, 1.22);
          vec3 c = y < 0.0 ? mix(horizon * 0.55, floorC, smoothstep(0.0, 0.35, -y))
                           : mix(horizon, top, smoothstep(0.0, 0.6, y));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  )
  scene.add(sky)

  const panel = (w, h, intensity, pos, look = [0, 1, 0]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    m.lookAt(...look)
    scene.add(m)
  }
  // big overhead softbox
  panel(14, 6, 4, [0, 12, 0], [0, 0, 0])
  // long horizontal strips (the "lines" you see on the panels)
  panel(30, 0.8, 6, [0, 4, -14])
  panel(30, 0.6, 5, [0, 6, 14])
  panel(0.8, 20, 3, [-16, 5, 0])
  panel(0.8, 20, 3, [16, 5, 0])
  // dark flags for contrast on the flanks
  const flag = (pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ color: 0x0c0c0c, side: THREE.DoubleSide }))
    m.position.set(...pos)
    m.lookAt(0, 1, 0)
    scene.add(m)
  }
  flag([12, 1.5, 9])
  flag([-12, 1.5, -9])

  const pmrem = new THREE.PMREMGenerator(renderer)
  cached = pmrem.fromScene(scene, 0.03).texture
  pmrem.dispose()
  return cached
}
