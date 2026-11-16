import * as THREE from 'three'
import { createBrushedTexture, createDiscTexture } from './cybertruckGeometry'

/**
 * Materials shared by every Cybertruck instance on the page, so a finish change
 * in the customizer morphs the hero stage and every gallery card at once.
 */
let M = null

export function getMaterials() {
  if (M) return M
  const brushed = createBrushedTexture()
  const disc = createDiscTexture()
  const body = new THREE.MeshPhysicalMaterial({
    color: '#c3c7cc',
    metalness: 1,
    roughness: 0.32,
    roughnessMap: brushed,
    clearcoat: 0.05,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.15,
  })
  const bodyDouble = body.clone()
  bodyDouble.side = THREE.DoubleSide
  bodyDouble.roughnessMap = brushed

  M = {
    brushed,
    body,
    bodyDouble,
    glass: new THREE.MeshPhysicalMaterial({
      color: '#07080a',
      metalness: 0.3,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.4,
      side: THREE.DoubleSide,
    }),
    trim: new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.78, metalness: 0.1 }),
    hole: new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    interior: new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.8 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.9, metalness: 0 }),
    rubberDouble: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    rim: new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }),
    cover: new THREE.MeshPhysicalMaterial({ color: '#202226', roughness: 0.35, metalness: 0.6, clearcoat: 0.8 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e2e5e9', roughness: 0.12, metalness: 1 }),
    alu: new THREE.MeshStandardMaterial({ color: '#b9bcc1', roughness: 0.38, metalness: 0.95 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: '#3b3d41', roughness: 0.45, metalness: 0.85 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b87333', roughness: 0.35, metalness: 1 }),
    caliper: new THREE.MeshStandardMaterial({ color: '#1d1e21', roughness: 0.4, metalness: 0.5 }),
    battery: new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.55, metalness: 0.6 }),
    orange: new THREE.MeshStandardMaterial({ color: '#ff6a13', roughness: 0.5, metalness: 0.2 }),
    disc: new THREE.MeshStandardMaterial({ map: disc, roughness: 0.4, metalness: 0.9 }),
  }
  return M
}
