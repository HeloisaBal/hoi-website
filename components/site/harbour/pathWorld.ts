/* ------------------------------------------------------------
   The path world: where visitors choose their path when they land
   (inspired by thelaend.de). Three low-poly island cities in a calm
   sea, one per main path, each in its persona's colours and with
   its own landmark:
   - founder:  a workshop (the big hoi house) with a crane
   - investor: towers and a lighthouse
   - company:  a harbour with warehouses, containers and a ship
   Bridges link the islands; a ferry and a sailboat move between them.

   Pure three.js, no React (PathWorld.tsx drives it). Loaded only in
   the browser, after the first paint.
   ------------------------------------------------------------ */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PersonaId, Theme } from '../data'

export type IslandSpec = { id: PersonaId; theme: Theme }

export type PathWorld = {
  frame: (now: number) => void
  resize: (w: number, h: number) => void
  /** screen position of each island's label, or null when off screen */
  labelPositions: () => Partial<Record<PersonaId, { x: number; y: number }>>
  /** the island under a point on the canvas (CSS pixels) */
  pickAt: (x: number, y: number) => PersonaId | null
  hover: (id: PersonaId | null) => void
  flyTo: (id: PersonaId | null) => void
  dispose: () => void
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/** the hoi house from the logo, extruded */
function houseGeometry() {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.86); s.lineTo(-0.5, 1); s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false })
  g.translate(0, 0, -0.4)
  return g
}

/** an irregular round island slab, flat-shaded; top surface at y = top */
function slabGeometry(radius: number, top: number, thickness: number, seed: number, bevel: number) {
  const r = rng(seed)
  const n = 11
  const pts: THREE.Vector2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = radius * (0.86 + r() * 0.24)
    pts.push(new THREE.Vector2(Math.cos(a) * k, Math.sin(a) * k))
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth: thickness, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel * 0.8, bevelSegments: 1,
  })
  g.rotateX(-Math.PI / 2) // extrusion now points up
  g.translate(0, top - thickness - bevel * 0.8, 0)
  return g
}

/* Island layouts: a triangle on wide screens, a zigzag down the screen on tall ones. */
const WIDE: Record<string, [number, number]> = { founder: [-7.2, 2.6], investor: [0, -4.2], company: [7.2, 2.6] }
const TALL: Record<string, [number, number]> = { founder: [-1.6, -7.4], investor: [2.2, 0], company: [-1.6, 7.4] }
const RADIUS = 3.3

export function createPathWorld(canvas: HTMLCanvasElement, islands: IslandSpec[], opts: { light: boolean; reduced: boolean; tall: boolean }): PathWorld {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.light, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.light ? 1.5 : 2))
  renderer.shadowMap.enabled = !opts.light
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200)
  const disposables: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => { disposables.push(x); return x }
  const mat = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
    keep(new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra }))
  const shadow = (o: THREE.Object3D) => { o.traverse((c) => { c.castShadow = !opts.light; c.receiveShadow = !opts.light }); return o }

  /* light */
  scene.add(new THREE.HemisphereLight('#ffffff', '#cfe9ff', 1.9))
  const sun = new THREE.DirectionalLight('#fffaf0', 2.1)
  sun.position.set(-12, 24, 14)
  sun.castShadow = !opts.light
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 })
  sun.shadow.bias = -0.0008
  scene.add(sun)

  /* sea */
  const water = new THREE.Mesh(keep(new THREE.CircleGeometry(40, 48)), mat('#bfe6f4', { roughness: 0.4, transparent: true, opacity: 0.9 }))
  water.rotation.x = -Math.PI / 2
  water.position.y = -0.05
  water.receiveShadow = !opts.light
  scene.add(water)

  const layout = opts.tall ? TALL : WIDE
  const houseGeo = keep(houseGeometry())
  const boxGeo = keep(new THREE.BoxGeometry(1, 1, 1))
  const coneGeo = keep(new THREE.ConeGeometry(0.26, 0.75, 5)); coneGeo.translate(0, 0.37, 0)
  const cylGeo = keep(new THREE.CylinderGeometry(0.5, 0.5, 1, 8))
  const white = mat('#ffffff')
  const sand = mat('#f6eedb')
  const treeMat = mat('#4fb594', { roughness: 1 })

  type Island = { id: PersonaId; group: THREE.Group; base: THREE.Vector3; lift: number; liftTo: number }
  const isles: Island[] = []

  for (const [i, spec] of islands.entries()) {
    const [x, z] = layout[spec.id] ?? [0, 0]
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.userData.id = spec.id
    const t = spec.theme
    const grass = new THREE.Color(t.c1).lerp(new THREE.Color('#ffffff'), 0.62)
    const accent = mat(t.accent), c1 = mat(t.c1), c3 = mat(t.c3)
    const r = rng(11 + i * 17)

    // ground: sand ring, then the grass top
    g.add(new THREE.Mesh(keep(slabGeometry(RADIUS + 0.45, 0.06, 0.5, 3 + i, 0.15)), sand))
    g.add(new THREE.Mesh(keep(slabGeometry(RADIUS, 0.32, 0.5, 9 + i, 0.18)), mat(grass)))
    const top = 0.32 + 0.14

    const put = (mesh: THREE.Object3D, px: number, pz: number, y = top) => { mesh.position.set(px, y, pz); g.add(mesh); return mesh }
    const box = (w: number, h: number, d: number, m: THREE.Material, px: number, pz: number, y = top) => {
      const b = new THREE.Mesh(boxGeo, m); b.scale.set(w, h, d); b.position.set(px, y + h / 2, pz); g.add(b); return b
    }

    // small houses around the edge
    const houseMats = [white, white, c1, c3]
    for (let k = 0; k < 9; k++) {
      const a = r() * Math.PI * 2, d = 1.5 + r() * 1.3
      const h = new THREE.Mesh(houseGeo, houseMats[k % houseMats.length])
      const s = 0.42 + r() * 0.3
      h.scale.set(s, s * (0.9 + r() * 0.6), s)
      h.rotation.y = (r() - 0.5) * 1.2
      put(h, Math.cos(a) * d, Math.sin(a) * d * 0.85)
    }
    // trees
    for (let k = 0; k < 7; k++) {
      const a = r() * Math.PI * 2, d = 1.9 + r() * 1.1
      const tr = new THREE.Mesh(coneGeo, treeMat)
      const s = 0.7 + r() * 0.6
      tr.scale.set(s, s, s)
      put(tr, Math.cos(a) * d, Math.sin(a) * d * 0.85)
    }

    // landmark
    if (spec.id === 'founder') {
      const hq = new THREE.Mesh(houseGeo, accent)
      hq.scale.set(1.7, 2.1, 1.7)
      put(hq, -0.2, 0.1)
      const win = new THREE.Mesh(boxGeo, white); win.scale.set(0.2, 0.42, 0.04); win.position.set(0, 0.55, 0.41)
      hq.add(win)
      // crane
      box(0.14, 3.2, 0.14, c3, 1.1, -0.7)
      box(2.2, 0.12, 0.14, c3, 0.5, -0.7, top + 3.1)
      box(0.04, 0.9, 0.04, white, -0.4, -0.7, top + 2.25)
      box(0.3, 0.25, 0.3, c1, -0.4, -0.7, top + 2.0)
    } else if (spec.id === 'investor') {
      const towers: [number, number, number, THREE.Material][] = [[-0.6, -0.2, 2.6, white], [0.15, -0.6, 3.4, c1], [0.8, 0.1, 2.1, white], [-0.1, 0.6, 1.6, c3]]
      for (const [tx, tz, th, m] of towers) {
        box(0.7, th, 0.7, m, tx, tz)
        box(0.72, 0.06, 0.72, accent, tx, tz, top + th * 0.62)
      }
      // lighthouse on the shore
      const lh = new THREE.Group()
      for (let k = 0; k < 4; k++) {
        const ring = new THREE.Mesh(cylGeo, k % 2 ? white : accent)
        ring.scale.set(0.5 - k * 0.05, 0.55, 0.5 - k * 0.05); ring.position.y = 0.27 + k * 0.55; lh.add(ring)
      }
      const lamp = new THREE.Mesh(keep(new THREE.ConeGeometry(0.32, 0.45, 8)), accent); lamp.position.y = 2.6; lh.add(lamp)
      const glow = new THREE.Mesh(boxGeo, keep(new THREE.MeshBasicMaterial({ color: '#fff3b0' }))); glow.scale.set(0.3, 0.2, 0.3); glow.position.y = 2.3; lh.add(glow)
      put(lh, 2.3, 1.4)
    } else {
      // harbour: warehouses, containers, a pier and a moored ship
      box(1.7, 0.75, 0.9, white, -0.7, -0.6)
      box(1.7, 0.08, 0.95, accent, -0.7, -0.6, top + 0.75)
      box(1.3, 0.65, 0.8, c1, 0.5, -1.4)
      const cont = [accent, c1, white, c3, mat('#ffb703')]
      for (let k = 0; k < 6; k++) box(0.55, 0.28, 0.26, cont[k % cont.length], 0.6 + (k % 2) * 0.6, 0.4 + Math.floor(k / 2) * 0.3, top + (k % 3 === 2 ? 0.28 : 0))
      box(0.5, 0.1, 2.0, sand, 2.6, 0.9, 0.05) // pier
      const ship = new THREE.Group()
      const hull = new THREE.Mesh(boxGeo, c3); hull.scale.set(0.5, 0.22, 1.5); ship.add(hull)
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(boxGeo, cont[k]); b.scale.set(0.2, 0.16, 0.3); b.position.set(k % 2 ? 0.1 : -0.1, 0.2, -0.3 + Math.floor(k / 2) * 0.32); ship.add(b) }
      ship.position.set(3.3, 0.07, 1.1)
      g.add(ship)
    }

    scene.add(shadow(g))
    isles.push({ id: spec.id, group: g, base: g.position.clone(), lift: 0, liftTo: 0 })
  }

  /* bridges between the islands */
  for (let i = 0; i < isles.length; i++) {
    const a = isles[i].base, b = isles[(i + 1) % isles.length].base
    if (isles.length < 3 && i === isles.length - 1) break
    const len = a.distanceTo(b) - RADIUS * 1.6
    if (len <= 0) continue
    const br = new THREE.Mesh(boxGeo, sand)
    br.scale.set(0.45, 0.1, len)
    br.position.copy(a).lerp(b, 0.5).setY(0.08)
    br.lookAt(b.x, 0.08, b.z)
    scene.add(shadow(br))
  }

  /* boats: a ferry between the islands, a sailboat around them */
  const ferry = new THREE.Group()
  const fh = new THREE.Mesh(boxGeo, white); fh.scale.set(0.42, 0.16, 0.9); ferry.add(fh)
  const fc = new THREE.Mesh(boxGeo, mat(islands[0]?.theme.accent ?? '#8a00e6')); fc.scale.set(0.3, 0.2, 0.4); fc.position.y = 0.17; ferry.add(fc)
  scene.add(shadow(ferry))
  const ferryPath = new THREE.CatmullRomCurve3(isles.map((s) => s.base.clone().setY(0.04).multiplyScalar(0.62)), true)
  const sail = new THREE.Group()
  const sb = new THREE.Mesh(boxGeo, white); sb.scale.set(0.22, 0.08, 0.6); sail.add(sb)
  const sm = new THREE.Mesh(keep(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 0.7), new THREE.Vector2(0.4, 0)]))), mat(islands[1]?.theme.c1 ?? '#34d399', { side: THREE.DoubleSide }))
  sm.position.set(0, 0.05, 0.1); sm.rotation.y = Math.PI / 2; sail.add(sm)
  scene.add(sail)

  /* camera: fit all islands, slightly from above; visitors can turn it a little */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableZoom = false
  controls.enablePan = false
  controls.minPolarAngle = 0.55
  controls.maxPolarAngle = 1.1
  controls.minAzimuthAngle = -0.6
  controls.maxAzimuthAngle = 0.6
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }
  canvas.style.touchAction = 'pan-y' // vertical swipes keep scrolling the page

  let width = 1, height = 1
  const centre = new THREE.Vector3(0, 0, 0)
  const span = { x: opts.tall ? 6 : 11.5, z: opts.tall ? 11.5 : 7.5 }
  const home = () => {
    const aspect = width / height
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect)
    const dist = Math.max(span.x / Math.tan(hfov / 2), (span.z * 0.85) / Math.tan(vfov / 2)) + 4
    return centre.clone().add(new THREE.Vector3().setFromSphericalCoords(dist, 0.92, 0))
  }
  controls.target.copy(centre)
  camera.position.copy(home())
  controls.update()

  let flight: { from: THREE.Vector3; to: THREE.Vector3; fromCam: THREE.Vector3; toCam: THREE.Vector3; t0: number; ms: number } | null = null
  let atHome = true
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  function flyTo(id: PersonaId | null) {
    const isle = isles.find((s) => s.id === id)
    atHome = !isle
    const to = isle ? isle.base.clone().setY(0.6) : centre.clone()
    const toCam = isle ? to.clone().add(new THREE.Vector3().subVectors(camera.position, controls.target).setLength(opts.tall ? 17 : 14)) : home()
    if (opts.reduced) { controls.target.copy(to); camera.position.copy(toCam); controls.update(); return }
    flight = { from: controls.target.clone(), to, fromCam: camera.position.clone(), toCam, t0: performance.now(), ms: 950 }
  }

  /* hover: the island rises a little */
  let hovered: PersonaId | null = null
  function hover(id: PersonaId | null) {
    hovered = id
    for (const s of isles) s.liftTo = s.id === id ? 1 : 0
  }
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  function pickAt(x: number, y: number) {
    ndc.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(isles.map((s) => s.group), true)[0]
    let o: THREE.Object3D | null = hit?.object ?? null
    while (o && !o.userData.id) o = o.parent
    return (o?.userData.id as PersonaId | undefined) ?? null
  }

  const anchors = isles.map((s) => ({ id: s.id, v: s.base.clone().setY(opts.tall ? 3.9 : 4.4) }))
  const tmp = new THREE.Vector3()
  function labelPositions() {
    const out: Partial<Record<PersonaId, { x: number; y: number }>> = {}
    for (const a of anchors) {
      tmp.copy(a.v).project(camera)
      if (tmp.z < 1) out[a.id] = { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
    }
    return out
  }

  let interacting = false
  controls.addEventListener('start', () => { interacting = true; flight = null; atHome = false })
  controls.addEventListener('end', () => { interacting = false })
  const t0 = performance.now()
  let last = t0

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (flight) {
      const t = Math.min(1, (now - flight.t0) / flight.ms)
      const e = ease(t)
      controls.target.lerpVectors(flight.from, flight.to, e)
      camera.position.lerpVectors(flight.fromCam, flight.toCam, e)
      if (t >= 1) flight = null
    }
    controls.update()
    for (const s of isles) {
      s.lift += (s.liftTo - s.lift) * Math.min(1, dt * 10)
      s.group.position.y = s.base.y + s.lift * 0.35
      s.group.scale.setScalar(1 + s.lift * 0.05)
    }
    if (!opts.reduced) {
      const time = (now - t0) / 1000
      // a slow drift while nobody is touching it, like a model on a turntable
      if (atHome && !interacting && !flight) {
        const sway = Math.sin(time * 0.25) * 0.12
        const off = new THREE.Vector3().subVectors(camera.position, controls.target)
        const sph = new THREE.Spherical().setFromVector3(off)
        sph.theta += (sway - sph.theta) * 0.02
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph))
      }
      const ft = (time * 0.025) % 1
      ferry.position.copy(ferryPath.getPointAt(ft))
      const tan = ferryPath.getTangentAt(ft)
      ferry.rotation.y = Math.atan2(tan.x, tan.z)
      ferry.position.y = 0.04 + Math.sin(time * 2) * 0.02
      const a = time * 0.12
      const R = opts.tall ? 7.5 : 12.5
      sail.position.set(Math.cos(a) * R, -0.02 + Math.sin(time * 1.7) * 0.03, Math.sin(a) * R * 0.75)
      sail.rotation.y = -a
    }
    canvas.style.cursor = hovered ? '' : 'grab' // over an island: the hoi cursor (HoiCursor.tsx) takes over
    renderer.render(scene, camera)
  }

  function resize(w: number, h: number) {
    width = w; height = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    if (atHome && !flight) { controls.target.copy(centre); camera.position.copy(home()); controls.update() }
  }

  return {
    frame, resize, labelPositions, pickAt, hover, flyTo,
    dispose() {
      controls.dispose()
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}
