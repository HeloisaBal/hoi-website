/* ------------------------------------------------------------
   The 3D harbour map: a low-poly Northwest of Germany.
   North Sea at the back, the Weser running down to Bremen, towns
   made of little hoi houses, trees, wind turbines on the coast and
   a container ship sailing between Bremerhaven and Bremen.

   Pure three.js, no React. HarbourMap.tsx loads this (and three.js)
   only when the section is about to scroll into view.

   Coordinates: the 2D map's 1600 × 1100 "world" (data.ts CITIES) is
   mapped onto the ground, 40 world units per 3D unit, sea at -z.
   ------------------------------------------------------------ */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CITIES, type CityId } from '../data'

export type Palette = { c1: string; c2: string; c3: string; accent: string; tint: string }

export type HarbourScene = {
  /** call every frame; returns false when nothing moved (the loop may idle) */
  frame: (now: number) => boolean
  resize: (w: number, h: number) => void
  /** screen position of each town's label, or null when off screen */
  labelPositions: () => Record<CityId, { x: number; y: number } | null>
  /** which way north points on screen, in radians clockwise from up (for the compass) */
  north: () => number
  flyTo: (city: CityId | null, instant?: boolean) => void
  /** room taken by the town panel, so the town stays visible next to it */
  setPanel: (panel: { side: 'right' | 'bottom'; size: number } | null) => void
  zoom: (factor: number) => void
  setPalette: (p: Palette) => void
  dispose: () => void
}

const X = (x: number) => (x - 800) / 40
const Z = (y: number) => (y - 550) / 40

/* Coastline and river, in 2D map units, traced from the flat map. */
const COAST = [[-200, 470], [0, 470], [120, 445], [200, 465], [300, 430], [450, 395], [640, 400], [690, 455], [720, 485], [765, 455], [800, 390], [900, 345], [1000, 340], [1040, 372], [1060, 360], [1200, 305], [1300, 320], [1500, 305], [1800, 310]]
  .map(([x, y]) => [X(x), Z(y)] as const)
const RIVER = [[1048, 330], [1052, 420], [1062, 500], [1100, 600], [1150, 820], [1220, 1000], [1270, 1140]]
  .map(([x, y]) => [X(x), Z(y)] as const)

/** z of the coast at x (land is south of it, +z) */
function coastZ(x: number) {
  for (let i = 1; i < COAST.length; i++) {
    const [x0, z0] = COAST[i - 1]
    const [x1, z1] = COAST[i]
    if (x <= x1) return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0 || 1)
  }
  return COAST[COAST.length - 1][1]
}

/** distance from (x, z) to a polyline */
function distTo(line: readonly (readonly [number, number])[], x: number, z: number) {
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1]
    const [bx, bz] = line[i]
    const dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)))
  }
  return best
}

/** gentle rolling hills, no randomness so it looks the same every time */
const hills = (x: number, z: number) =>
  0.18 * Math.sin(x * 0.45 + 1.3) * Math.cos(z * 0.5) + 0.12 * Math.sin(x * 1.1 + z * 0.8) + 0.08 * Math.cos(z * 1.7 - x * 0.4)

/** small deterministic random generator, so trees and houses don't jump on reload */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export const CITY_POS: Record<CityId, THREE.Vector3> = Object.fromEntries(
  Object.entries(CITIES).map(([id, c]) => [id, new THREE.Vector3(X(c.x), 0, Z(c.y))]),
) as Record<CityId, THREE.Vector3>

function groundHeight(x: number, z: number) {
  const coast = coastZ(x)
  const river = distTo(RIVER, x, z)
  if (z < coast - 0.15) return -0.9
  let h = 0.12 + Math.max(0, hills(x, z)) * Math.min(1, (z - coast) / 3)
  if (river < 0.75) h = Math.min(h, -0.55 + river * 0.6)
  return h
}

/* ---------- the hoi house: front shape from the logo, extruded ---------- */
function houseGeometry() {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0)
  s.lineTo(0.5, 0)
  s.lineTo(0.5, 0.86)
  s.lineTo(-0.5, 1)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false })
  g.translate(0, 0, -0.4)
  return g
}

export function createHarbourScene(canvas: HTMLCanvasElement, palette: Palette, opts: { light: boolean; reduced: boolean }): HarbourScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.light, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.light ? 1.5 : 2))
  renderer.shadowMap.enabled = !opts.light
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(palette.tint, 34, 62)

  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200)
  const disposables: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => { disposables.push(x); return x }

  /* ---------- light ---------- */
  const hemi = new THREE.HemisphereLight('#ffffff', palette.c1, 1.7)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fffaf0', 2.2)
  sun.position.set(-14, 26, 16)
  sun.castShadow = !opts.light
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -20, near: 1, far: 80 })
  sun.shadow.bias = -0.0008
  scene.add(sun)

  /* ---------- ground: low-poly terrain with flat-shaded faces ---------- */
  const W = 56, D = 40
  const seg = opts.light ? [56, 40] : [96, 68]
  let terrainGeo = new THREE.PlaneGeometry(W, D, seg[0], seg[1])
  terrainGeo.rotateX(-Math.PI / 2)
  terrainGeo.translate(2, 0, 2)
  const pos = terrainGeo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)))
  terrainGeo = terrainGeo.toNonIndexed() as THREE.PlaneGeometry
  keep(terrainGeo)
  const tp = terrainGeo.attributes.position
  const colors = new Float32Array(tp.count * 3)
  const grass = [new THREE.Color('#bfe8cf'), new THREE.Color('#b8e5ca'), new THREE.Color('#c5ebd4')]
  const sand = new THREE.Color('#f4ecd4')
  const bed = new THREE.Color('#9db6ff')
  const c = new THREE.Color()
  for (let f = 0; f < tp.count; f += 3) {
    const cx = (tp.getX(f) + tp.getX(f + 1) + tp.getX(f + 2)) / 3
    const cy = (tp.getY(f) + tp.getY(f + 1) + tp.getY(f + 2)) / 3
    const cz = (tp.getZ(f) + tp.getZ(f + 1) + tp.getZ(f + 2)) / 3
    if (cy < -0.2) c.copy(bed)
    else if (cz - coastZ(cx) < 0.6 || distTo(RIVER, cx, cz) < 0.95) c.copy(sand)
    else c.copy(grass[Math.abs(Math.floor(cx * 3.1 + cz * 2.7)) % 3])
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3)
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  terrainGeo.computeVertexNormals()
  const terrainMat = keep(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }))
  const terrain = new THREE.Mesh(terrainGeo, terrainMat)
  terrain.receiveShadow = !opts.light
  scene.add(terrain)

  /* ---------- water: one surface over sea and river ---------- */
  const waterGeo = keep(new THREE.PlaneGeometry(W + 40, D + 40, 1, 1))
  waterGeo.rotateX(-Math.PI / 2)
  const waterMat = keep(new THREE.MeshStandardMaterial({ color: palette.c2, transparent: true, opacity: 0.78, roughness: 0.35, metalness: 0.1 }))
  const water = new THREE.Mesh(waterGeo, waterMat)
  water.position.y = -0.18
  scene.add(water)

  /* ---------- towns of hoi houses ---------- */
  const houseGeo = keep(houseGeometry())
  const houseMat = keep(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, flatShading: true }))
  const rand = rng(7)
  const housesPer: Record<CityId, number> = { emden: 7, wilhelmshaven: 9, bremerhaven: 11, oldenburg: 12, bremen: 18 }
  const total = Object.values(housesPer).reduce((a, b) => a + b, 0)
  const houses = new THREE.InstancedMesh(houseGeo, houseMat, total)
  houses.castShadow = houses.receiveShadow = !opts.light
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3()
  const houseColours = [palette.c1, '#ffffff', '#ffffff', palette.c3, '#ffffff']
  let hi = 0
  const townSpots: { x: number; z: number; r: number }[] = []
  for (const [id, n] of Object.entries(housesPer) as [CityId, number][]) {
    const base = CITY_POS[id]
    townSpots.push({ x: base.x, z: base.z, r: id === 'bremen' ? 2.6 : 1.8 })
    for (let k = 0; k < n; k++) {
      const a = rand() * Math.PI * 2
      const r = 0.5 + Math.sqrt(rand()) * (id === 'bremen' ? 2.1 : 1.4)
      let x = base.x + Math.cos(a) * r
      let z = base.z + Math.sin(a) * r * 0.8
      if (distTo(RIVER, x, z) < 0.9) x += x > base.x ? 1 : -1
      if (z < coastZ(x) + 0.6) z = coastZ(x) + 0.6 + rand()
      const s = 0.45 + rand() * 0.35
      p.set(x, groundHeight(x, z) - 0.02, z)
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rand() - 0.5) * 0.9)
      sc.set(s, s * (0.9 + rand() * 0.7), s)
      houses.setMatrixAt(hi, m.compose(p, q, sc))
      houses.setColorAt(hi, new THREE.Color(houseColours[Math.floor(rand() * houseColours.length)]))
      hi++
    }
  }
  scene.add(houses)

  /* hoi's own house in Bremen: big, in the persona colour, with the window */
  const hqMat = keep(new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.6, flatShading: true }))
  const hq = new THREE.Mesh(houseGeo, hqMat)
  const hqPos = CITY_POS.bremen.clone().add(new THREE.Vector3(-0.9, 0, 0.9))
  hq.position.set(hqPos.x, groundHeight(hqPos.x, hqPos.z), hqPos.z)
  hq.scale.set(1.9, 2.3, 1.9)
  hq.castShadow = !opts.light
  scene.add(hq)
  const winGeo = keep(new THREE.BoxGeometry(0.12, 0.24, 0.02))
  const winMat = keep(new THREE.MeshBasicMaterial({ color: '#ffffff' }))
  const win = new THREE.Mesh(winGeo, winMat)
  win.position.set(0, 0.54, 0.41)
  hq.add(win)

  /* ---------- trees (instanced cones) ---------- */
  const treeGeo = keep(new THREE.ConeGeometry(0.26, 0.75, 5))
  treeGeo.translate(0, 0.37, 0)
  const treeMat = keep(new THREE.MeshStandardMaterial({ color: '#4fb594', roughness: 1, flatShading: true }))
  const nTrees = opts.light ? 130 : 240
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, nTrees)
  trees.castShadow = !opts.light
  const tr = rng(21)
  const treeShades = ['#3d9f80', '#5cc39f', '#2f8a6e', '#6fcfab']
  let placed = 0
  for (let tries = 0; placed < nTrees && tries < nTrees * 20; tries++) {
    const x = -22 + tr() * 48
    const z = -8 + tr() * 24
    if (z < coastZ(x) + 0.9 || distTo(RIVER, x, z) < 1.1) continue
    if (townSpots.some((t) => Math.hypot(t.x - x, (t.z - z) * 1.2) < t.r)) continue
    // forests: more trees in a few patches
    const patch = Math.sin(x * 0.42 + 0.6) * Math.cos(z * 0.5 - 0.3)
    if (patch < 0.25 && tr() > 0.06) continue
    const s = 0.6 + tr() * 0.7
    p.set(x, groundHeight(x, z) - 0.03, z)
    q.identity()
    sc.set(s, s * (0.8 + tr() * 0.6), s)
    trees.setMatrixAt(placed, m.compose(p, q, sc))
    trees.setColorAt(placed, new THREE.Color(treeShades[Math.floor(tr() * treeShades.length)]))
    placed++
  }
  trees.count = placed
  scene.add(trees)

  /* ---------- wind turbines along the coast ---------- */
  const poleGeo = keep(new THREE.CylinderGeometry(0.03, 0.06, 2.2, 6))
  poleGeo.translate(0, 1.1, 0)
  const bladeGeo = keep(new THREE.BoxGeometry(0.06, 0.9, 0.02))
  bladeGeo.translate(0, 0.45, 0)
  const whiteMat = keep(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }))
  const rotors: THREE.Group[] = []
  for (const x of [-21, -17.5, -13, -9.5, -4.5, 3, 9.5, 14.5]) {
    const z = coastZ(x) + 1.1
    const t = new THREE.Group()
    t.position.set(x, groundHeight(x, z), z)
    const pole = new THREE.Mesh(poleGeo, whiteMat)
    pole.castShadow = !opts.light
    t.add(pole)
    const rotor = new THREE.Group()
    rotor.position.set(0, 2.2, 0.08)
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(bladeGeo, whiteMat)
      blade.rotation.z = (b * Math.PI * 2) / 3
      rotor.add(blade)
    }
    rotor.rotation.z = x
    t.add(rotor)
    rotors.push(rotor)
    scene.add(t)
  }

  /* ---------- container ship on the Weser ---------- */
  const ship = new THREE.Group()
  const hullGeo = keep(new THREE.BoxGeometry(0.36, 0.16, 1.2))
  const hullMat = keep(new THREE.MeshStandardMaterial({ color: palette.c3, roughness: 0.7 }))
  ship.add(new THREE.Mesh(hullGeo, hullMat))
  const boxGeo = keep(new THREE.BoxGeometry(0.14, 0.12, 0.28))
  const boxMats = [palette.c1, '#ffffff', palette.accent, '#ffb703'].map((col) => keep(new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 })))
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(boxGeo, boxMats[i % boxMats.length])
    b.position.set(i % 2 ? 0.08 : -0.08, 0.14, -0.3 + Math.floor(i / 2) * 0.28)
    ship.add(b)
  }
  const bridge = new THREE.Mesh(keep(new THREE.BoxGeometry(0.3, 0.26, 0.18)), whiteMat)
  bridge.position.set(0, 0.2, 0.5)
  ship.add(bridge)
  ship.traverse((o) => { o.castShadow = !opts.light })
  scene.add(ship)
  const riverPath = new THREE.CatmullRomCurve3(RIVER.slice(1, 5).map(([x, z]) => new THREE.Vector3(x, -0.1, z)))

  /* ---------- sailboat on the sea ---------- */
  const sail = new THREE.Group()
  sail.add(new THREE.Mesh(keep(new THREE.BoxGeometry(0.22, 0.08, 0.6)), whiteMat))
  const sailShape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 0.7), new THREE.Vector2(0.4, 0)])
  const sailMesh = new THREE.Mesh(keep(new THREE.ShapeGeometry(sailShape)), keep(new THREE.MeshStandardMaterial({ color: palette.c1, side: THREE.DoubleSide })))
  sailMesh.position.set(0, 0.05, 0.1)
  sailMesh.rotation.y = Math.PI / 2
  sail.add(sailMesh)
  scene.add(sail)

  /* ---------- camera and controls ---------- */
  const controls = new OrbitControls(camera, canvas)
  /* The starting view. Wide screens: north (the sea) at the back. Tall phone
     screens: the map is turned a quarter, west at the top and the coast on the
     right, so the whole Northwest from Emden to Bremen fits the long side. */
  let width = 1, height = 1
  const home = () => {
    const aspect = width / height
    const tall = aspect < 0.9
    const target = tall ? new THREE.Vector3(-2.5, 0, 1.2) : new THREE.Vector3(1, 0, 1.5)
    const halfW = tall ? 8 : 17
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * aspect)
    const dist = Math.min(62, Math.max(20, halfW / Math.tan(hfov / 2)))
    const azimuth = tall ? Math.PI / 2 : 0
    return { target, dist, polar: tall ? 0.7 : 0.92, azimuth }
  }
  const homeCam = (h = home()) => h.target.clone().add(new THREE.Vector3().setFromSphericalCoords(h.dist, h.polar, h.azimuth))
  /* how far visitors may turn the map, around its starting direction */
  const setTurnLimits = (azimuth: number) => {
    controls.minAzimuthAngle = azimuth - 0.75
    controls.maxAzimuthAngle = azimuth + 0.75
  }
  controls.target.copy(home().target)
  camera.position.copy(homeCam())
  let atHome = true
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableZoom = false // the mouse wheel keeps scrolling the page; zoom has buttons
  controls.screenSpacePanning = false
  controls.minPolarAngle = 0.45
  controls.maxPolarAngle = 1.12
  setTurnLimits(0)
  controls.minDistance = 9
  controls.maxDistance = 52
  // phones: swiping up and down still scrolls the page (the browser keeps vertical
  // swipes); swiping sideways turns the map, two fingers zoom and move it
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
  canvas.style.touchAction = 'pan-y'
  controls.update()

  let flight: { from: THREE.Vector3; to: THREE.Vector3; fromCam: THREE.Vector3; toCam: THREE.Vector3; t0: number; ms: number } | null = null
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  function flyTo(city: CityId | null, instant = opts.reduced) {
    atHome = !city
    const h = home()
    const to = city ? CITY_POS[city].clone().setY(0.3) : h.target
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
    const toCam = city ? to.clone().add(offset.setLength(Math.min(offset.length(), opts.light ? 26 : 22))) : homeCam(h)
    if (instant) { controls.target.copy(to); camera.position.copy(toCam); controls.update(); return }
    flight = { from: controls.target.clone(), to, fromCam: camera.position.clone(), toCam, t0: performance.now(), ms: 1100 }
  }

  /* shift the picture away from the panel (a view offset, so the camera itself doesn't move) */
  let shift = { x: 0, y: 0 }, shiftTo = { x: 0, y: 0 }
  function setPanel(panel: { side: 'right' | 'bottom'; size: number } | null) {
    shiftTo = !panel ? { x: 0, y: 0 } : panel.side === 'right' ? { x: panel.size / 2, y: 0 } : { x: 0, y: panel.size / 2 }
    if (opts.reduced) shift = { ...shiftTo }
  }
  const applyShift = () => {
    if (shift.x || shift.y) camera.setViewOffset(width, height, shift.x, shift.y, width, height)
    else camera.clearViewOffset()
  }

  function zoom(factor: number) {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
    const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor))
    flight = { from: controls.target.clone(), to: controls.target.clone(), fromCam: camera.position.clone(), toCam: controls.target.clone().add(offset.setLength(len)), t0: performance.now(), ms: opts.reduced ? 1 : 450 }
  }

  /* keep the view over the map */
  const clampTarget = () => {
    controls.target.x = Math.max(-16, Math.min(16, controls.target.x))
    controls.target.z = Math.max(-6, Math.min(10, controls.target.z))
    controls.target.y = 0
  }

  /* ---------- labels ---------- */
  const anchors = Object.fromEntries(
    (Object.keys(CITY_POS) as CityId[]).map((id) => {
      const v = CITY_POS[id]
      return [id, new THREE.Vector3(v.x, groundHeight(v.x, v.z) + (id === 'bremen' ? 3.1 : 1.6), v.z)]
    }),
  ) as Record<CityId, THREE.Vector3>
  const tmp = new THREE.Vector3()
  function labelPositions() {
    const out = {} as Record<CityId, { x: number; y: number } | null>
    for (const id of Object.keys(anchors) as CityId[]) {
      tmp.copy(anchors[id]).project(camera)
      out[id] = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1
        ? { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
        : null
    }
    return out
  }

  /* ---------- animation ---------- */
  let last = performance.now()
  let shipT = 0.2, shipDir = 1
  let userMoved = false
  controls.addEventListener('start', () => { userMoved = true; atHome = false; flight = null })
  controls.addEventListener('end', () => { userMoved = false })

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    let moving = userMoved
    if (flight) {
      const t = Math.min(1, (now - flight.t0) / flight.ms)
      const e = ease(t)
      controls.target.lerpVectors(flight.from, flight.to, e)
      camera.position.lerpVectors(flight.fromCam, flight.toCam, e)
      if (t >= 1) flight = null
      moving = true
    }
    if (controls.update()) moving = true
    clampTarget()
    // haze starts behind the area in view, however far the camera is
    const d = camera.position.distanceTo(controls.target)
    const fog = scene.fog as THREE.Fog
    fog.near = d * 0.95
    fog.far = d * 2
    if (Math.abs(shift.x - shiftTo.x) + Math.abs(shift.y - shiftTo.y) > 0.5) {
      shift.x += (shiftTo.x - shift.x) * 0.12
      shift.y += (shiftTo.y - shift.y) * 0.12
      applyShift()
      moving = true
    } else if (shift.x !== shiftTo.x || shift.y !== shiftTo.y) { shift = { ...shiftTo }; applyShift() }
    if (!opts.reduced) {
      rotors.forEach((r, i) => { r.rotation.z += dt * (1.4 + (i % 3) * 0.2) })
      shipT += dt * 0.018 * shipDir
      if (shipT > 0.97 || shipT < 0.03) shipDir *= -1
      const sp = riverPath.getPointAt(Math.max(0, Math.min(1, shipT)))
      const tan = riverPath.getTangentAt(Math.max(0, Math.min(1, shipT)))
      ship.position.copy(sp)
      ship.rotation.y = Math.atan2(tan.x, tan.z) + (shipDir < 0 ? Math.PI : 0)
      const a = now / 9000
      sail.position.set(-6 + Math.cos(a) * 5, -0.12, -9 + Math.sin(a) * 1.6)
      sail.rotation.y = -a + Math.PI
      sail.position.y = -0.12 + Math.sin(now / 600) * 0.03
      moving = true
    } else if (!ship.userData.placed) {
      ship.position.copy(riverPath.getPointAt(0.35))
      sail.position.set(-6, -0.12, -9)
      ship.userData.placed = true
    }
    renderer.render(scene, camera)
    return moving
  }

  function resize(w: number, h: number) {
    width = w; height = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // narrow screens see more of the map from further away
    camera.fov = w < 640 ? 40 : 32
    camera.updateProjectionMatrix()
    applyShift()
    const view = home()
    setTurnLimits(view.azimuth)
    if (atHome && !flight) { controls.target.copy(view.target); camera.position.copy(homeCam(view)); controls.update() }
  }

  function setPalette(pal: Palette) {
    waterMat.color.set(pal.c2)
    hqMat.color.set(pal.accent)
    hullMat.color.set(pal.c3)
    hemi.groundColor.set(pal.c1)
    ;(scene.fog as THREE.Fog).color.set(pal.tint)
  }

  return {
    frame, resize, labelPositions, flyTo, setPanel, zoom, setPalette,
    north: () => controls.getAzimuthalAngle(),
    dispose() {
      controls.dispose()
      houses.dispose()
      trees.dispose()
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}
