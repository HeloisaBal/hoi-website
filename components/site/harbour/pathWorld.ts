/* ------------------------------------------------------------
   The path world: the whole first screen where visitors choose
   their path (inspired by thelaend.de). A low-poly landscape with
   rolling hills, forests, the sea at the back, a river with a
   bridge, roads, wind turbines, a giant "hoi" on the hill and a
   blimp. Three districts, one per main path, each built for its
   persona and outlined in its colour:
   - founder:  launch pad with a rocket, maker space, workshop, crane
   - investor: glass towers, a bank with columns, gold coin stacks
   - company:  factory with smoking chimneys, warehouses, a container
               port with a gantry crane, trucks driving to the bridge
   Boats sail on the sea and the river.

   Pure three.js, no React (PathWorld.tsx drives it).
   Coordinates: x to the right, z towards the viewer, sea at -z.
   ------------------------------------------------------------ */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PersonaId, Theme } from '../data'

export type IslandSpec = { id: PersonaId; theme: Theme }

export type PathWorld = {
  frame: (now: number) => void
  resize: (w: number, h: number) => void
  /** screen position of each district's label */
  labelPositions: () => Partial<Record<PersonaId, { x: number; y: number }>>
  /** the district under a point on the canvas (CSS pixels) */
  pickAt: (x: number, y: number) => PersonaId | null
  hover: (id: PersonaId | null) => void
  flyTo: (id: PersonaId | null) => void
  dispose: () => void
}

/* ---------- the land ---------- */
type P = readonly [number, number]
const RIVER: P[] = [[5, -17], [6.5, -10], [5.5, -4], [7, 2], [6, 8], [9, 14], [13, 24]]
const DISTRICTS: Record<string, { x: number; z: number; r: number }> = {
  founder: { x: -13, z: 2, r: 5.6 },
  investor: { x: -1.5, z: 10.5, r: 5 },
  company: { x: 16.5, z: -2.5, r: 6.2 },
}
const LETTERS = { x: -14, z: -9 }

const coastZ = (x: number) => -14 + 1.6 * Math.sin(x * 0.18 + 0.5) + 0.8 * Math.sin(x * 0.47)

function distTo(line: readonly P[], x: number, z: number) {
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i]
    const dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)))
  }
  return best
}
const smooth = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t) }
const hills = (x: number, z: number) =>
  0.55 * Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.24) + 0.35 * Math.sin(x * 0.5 + z * 0.37) + 0.2 * Math.cos(z * 0.8 - x * 0.3)

function groundHeight(x: number, z: number) {
  const coast = coastZ(x)
  if (z < coast - 0.4) return -1.4
  let h = 0.35 + Math.max(-0.2, hills(x, z)) * 0.9
  // a ridge behind the "hoi" letters and along the left
  h += 2.6 * Math.exp(-((x - LETTERS.x) ** 2 / 60 + (z - LETTERS.z + 2.5) ** 2 / 22))
  h += 1.4 * smooth(-18, -30, x)
  // beach towards the sea
  h = THREE.MathUtils.lerp(-0.2, h, smooth(coast - 0.4, coast + 2.2, z))
  // flat ground for the districts
  for (const d of Object.values(DISTRICTS)) {
    const k = smooth(d.r + 2.5, d.r, Math.hypot(x - d.x, z - d.z))
    h = THREE.MathUtils.lerp(h, 0.3, k)
  }
  // the river valley
  const r = distTo(RIVER, x, z)
  if (r < 2.4) h = Math.min(h, THREE.MathUtils.lerp(-1, h, smooth(1.1, 2.4, r)))
  return h
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
/** a triangular prism (roofs, the bank's pediment), 1 wide, 1 high, 1 deep */
function prismGeometry() {
  const s = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.5, 1), new THREE.Vector2(-0.5, 0)])
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false })
  g.translate(0, 0, -0.5)
  return g
}
/** an irregular flat plot outline */
function plotGeometry(radius: number, seed: number, thickness: number) {
  const r = rng(seed)
  const n = 12
  const pts: THREE.Vector2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = radius * (0.88 + r() * 0.18)
    pts.push(new THREE.Vector2(Math.cos(a) * k, Math.sin(a) * k))
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: thickness, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
}

export function createPathWorld(canvas: HTMLCanvasElement, islands: IslandSpec[], opts: { light: boolean; reduced: boolean; tall: boolean; fog: string }): PathWorld {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.light, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.light ? 1.5 : 2))
  renderer.shadowMap.enabled = !opts.light
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(opts.fog, 40, 90)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 300)
  const disposables: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => { disposables.push(x); return x }
  const mats = new Map<string, THREE.MeshStandardMaterial>()
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const key = color + JSON.stringify(extra)
    let m = mats.get(key)
    if (!m) { m = keep(new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra })); mats.set(key, m) }
    return m
  }
  const castAll = (o: THREE.Object3D) => { o.traverse((c) => { c.castShadow = !opts.light; c.receiveShadow = !opts.light }); return o }

  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9e3a6', 1.7))
  const sun = new THREE.DirectionalLight('#fff6e0', 2.3)
  sun.position.set(-18, 30, 14)
  sun.castShadow = !opts.light
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 28, bottom: -28, near: 1, far: 100 })
  sun.shadow.bias = -0.0006
  scene.add(sun)

  /* ---------- terrain ---------- */
  const W = 80, D = 60
  const seg = opts.light ? [80, 60] : [140, 104]
  let terrainGeo: THREE.BufferGeometry = new THREE.PlaneGeometry(W, D, seg[0], seg[1])
  terrainGeo.rotateX(-Math.PI / 2)
  terrainGeo.translate(0, 0, 4)
  const tpos = terrainGeo.attributes.position
  for (let i = 0; i < tpos.count; i++) tpos.setY(i, groundHeight(tpos.getX(i), tpos.getZ(i)))
  terrainGeo = keep(terrainGeo.toNonIndexed())
  const tp = terrainGeo.attributes.position
  const colors = new Float32Array(tp.count * 3)
  const greens = ['#8bd07f', '#80c876', '#95d789', '#7bc172'].map((c) => new THREE.Color(c))
  const high = new THREE.Color('#a6dc95'), sand = new THREE.Color('#f1e4b8'), bed = new THREE.Color('#7fb2e6')
  const col = new THREE.Color()
  for (let f = 0; f < tp.count; f += 3) {
    const cx = (tp.getX(f) + tp.getX(f + 1) + tp.getX(f + 2)) / 3
    const cy = (tp.getY(f) + tp.getY(f + 1) + tp.getY(f + 2)) / 3
    const cz = (tp.getZ(f) + tp.getZ(f + 1) + tp.getZ(f + 2)) / 3
    if (cy < -0.25) col.copy(bed)
    else if (cz - coastZ(cx) < 1.6 || distTo(RIVER, cx, cz) < 1.6) col.copy(sand)
    else if (cy > 1.6) col.copy(high)
    else col.copy(greens[Math.abs(Math.floor(cx * 1.7 + cz * 2.3)) % greens.length])
    for (let k = 0; k < 3; k++) colors.set([col.r, col.g, col.b], (f + k) * 3)
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  terrainGeo.computeVertexNormals()
  const terrain = new THREE.Mesh(terrainGeo, keep(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })))
  terrain.receiveShadow = !opts.light
  scene.add(terrain)

  /* ---------- water ---------- */
  const waterMat = keep(new THREE.MeshStandardMaterial({ color: '#5e9cff', roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.88 }))
  const water = new THREE.Mesh(keep(new THREE.PlaneGeometry(W + 80, D + 80)), waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.y = -0.3
  scene.add(water)

  /* ---------- shared shapes ---------- */
  const box = keep(new THREE.BoxGeometry(1, 1, 1))
  const cyl = keep(new THREE.CylinderGeometry(0.5, 0.5, 1, 10))
  const cone = keep(new THREE.ConeGeometry(0.5, 1, 6))
  const prism = keep(prismGeometry())
  const house = keep(houseGeometry())
  const sphere = keep(new THREE.IcosahedronGeometry(0.5, 0))
  const white = mat('#ffffff'), grey = mat('#d9d6e0'), dark = mat('#3d3a4a'), road = mat('#bdbac6', { roughness: 1 })
  const gold = mat('#ffc83d', { metalness: 0.35, roughness: 0.45 })
  const glass = mat('#b9d6ff', { roughness: 0.25, metalness: 0.2 })

  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, [x, y, z]: number[], [sx, sy, sz]: number[] = [1, 1, 1], ry = 0) => {
    const o = new THREE.Mesh(geo, m)
    o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.y = ry
    parent.add(o)
    return o
  }
  /** a box standing on y, centred on x/z */
  const block = (parent: THREE.Object3D, m: THREE.Material, x: number, z: number, w: number, h: number, d: number, y = 0, ry = 0) =>
    add(parent, box, m, [x, y + h / 2, z], [w, h, d], ry)

  /* ---------- roads (flat strips following the ground) ---------- */
  const roadLines: P[][] = [
    [[-13, 2], [-8, 6.5], [-1.5, 10.5]],
    [[-1.5, 10.5], [2.5, 5], [5, 1], [8.5, -0.5], [12, -2], [16.5, -2.5]],
    [[-13, 2], [-16, -3], [-14, -6.5]],
    [[-1.5, 10.5], [-6, 16], [-12, 26]],
    [[16.5, -2.5], [22, 2], [32, 4]],
    [[-13, 2], [-24, 4], [-36, 3]],
  ]
  const roadCurves = roadLines.map((l) => new THREE.CatmullRomCurve3(l.map(([x, z]) => new THREE.Vector3(x, 0, z))))
  const BRIDGE = new THREE.Vector3(6.6, 0, 0.2)
  {
    const pieces: THREE.Matrix4[] = []
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0)
    for (const c of roadCurves) {
      const n = Math.ceil(c.getLength() / 0.5)
      for (let i = 0; i < n; i++) {
        const p = c.getPointAt(i / n), t = c.getTangentAt(i / n)
        if (p.distanceTo(BRIDGE) < 2.2) continue // the bridge carries the road here
        const y = Math.max(groundHeight(p.x, p.z), 0.05) + 0.05
        q.setFromAxisAngle(up, Math.atan2(t.x, t.z))
        pieces.push(m4.clone().compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(1.1, 0.08, 0.62)))
      }
    }
    const roads = new THREE.InstancedMesh(box, road, pieces.length)
    pieces.forEach((m, i) => roads.setMatrixAt(i, m))
    roads.receiveShadow = !opts.light
    scene.add(roads)
  }
  // the bridge over the river
  {
    const b = new THREE.Group()
    const t = roadCurves[1].getTangentAt(0.48)
    b.position.set(BRIDGE.x, 0.35, BRIDGE.z)
    b.rotation.y = Math.atan2(t.x, t.z)
    block(b, grey, 0, 0, 1.5, 0.2, 5.2)
    block(b, white, 0.7, 0, 0.08, 0.35, 5.2, 0.2)
    block(b, white, -0.7, 0, 0.08, 0.35, 5.2, 0.2)
    for (const z of [-1.2, 1.2]) block(b, grey, 0, z, 1.2, 1, 0.4, -0.95)
    scene.add(castAll(b))
  }

  /* ---------- forests ---------- */
  const avoid = (x: number, z: number, pad = 0) =>
    z < coastZ(x) + 1.8 || distTo(RIVER, x, z) < 2.3 + pad ||
    Object.values(DISTRICTS).some((d) => Math.hypot(x - d.x, z - d.z) < d.r + 1.2 + pad) ||
    roadLines.some((l) => distTo(l, x, z) < 1.1 + pad) ||
    Math.hypot(x - LETTERS.x, z - LETTERS.z) < 4.2
  {
    const nTrees = opts.light ? 380 : 900
    const pine = keep(new THREE.ConeGeometry(0.42, 1.3, 6)); pine.translate(0, 0.85, 0)
    const trunkless = keep(new THREE.IcosahedronGeometry(0.55, 0)); trunkless.translate(0, 0.75, 0)
    const shades = ['#2f9a5b', '#3aa865', '#23864e', '#4cb874'].map((c) => new THREE.Color(c))
    const tMat = mat('#ffffff', { roughness: 1 })
    const pines = new THREE.InstancedMesh(pine, tMat, nTrees)
    const rounds = new THREE.InstancedMesh(trunkless, tMat, Math.floor(nTrees / 3))
    const r = rng(42)
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3()
    let np = 0, nr = 0
    for (let tries = 0; tries < nTrees * 30 && (np < nTrees || nr < rounds.count); tries++) {
      const x = -38 + r() * 76, z = -14 + r() * 42
      if (avoid(x, z)) continue
      const patch = Math.sin(x * 0.23 + 0.4) * Math.cos(z * 0.29 - 0.6) + 0.35 * Math.sin(x * 0.7 + z * 0.5)
      if (patch < 0.1 && r() > 0.12) continue
      const k = 0.7 + r() * 0.75
      p.set(x, groundHeight(x, z) - 0.05, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6); s.set(k, k * (0.85 + r() * 0.5), k)
      const c = shades[Math.floor(r() * shades.length)]
      if (r() < 0.75 && np < nTrees) { pines.setMatrixAt(np, m4.compose(p, q, s)); pines.setColorAt(np++, c) }
      else if (nr < rounds.count) { rounds.setMatrixAt(nr, m4.compose(p, q, s)); rounds.setColorAt(nr++, c) }
    }
    pines.count = np; rounds.count = nr
    pines.castShadow = rounds.castShadow = !opts.light
    scene.add(pines, rounds)
  }

  /* ---------- wind turbines on the coast ---------- */
  const rotors: THREE.Group[] = []
  for (const x of [-30, -25, -20.5, 26, 30.5]) {
    const z = coastZ(x) + 2.8
    const t = new THREE.Group()
    t.position.set(x, groundHeight(x, z), z)
    add(t, cyl, white, [0, 1.7, 0], [0.12, 3.4, 0.12])
    const rotor = new THREE.Group()
    rotor.position.set(0, 3.4, 0.12)
    for (let b = 0; b < 3; b++) { const bl = add(rotor, box, white, [0, 0.7, 0], [0.1, 1.4, 0.03]); bl.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), (b * Math.PI * 2) / 3); bl.rotation.z = (b * Math.PI * 2) / 3 }
    t.add(rotor)
    rotors.push(rotor)
    scene.add(castAll(t))
  }

  /* ---------- the giant "hoi" on the hill (logo colours) ---------- */
  {
    const g = new THREE.Group()
    const y0 = groundHeight(LETTERS.x, LETTERS.z) - 0.1
    g.position.set(LETTERS.x, y0, LETTERS.z)
    g.rotation.y = 0.18
    const purple = mat('#9a00ff'), teal = mat('#00d7b8'), blue = mat('#003efe')
    // h
    block(g, purple, -3.1, 0, 0.8, 3.4, 0.8)
    block(g, purple, -1.7, 0, 0.8, 2.2, 0.8)
    block(g, purple, -2.4, 0, 1.6, 0.8, 0.8, 1.4)
    // o: the hoi house, as in the logo
    add(g, house, teal, [0.1, 0, 0], [2.2, 2.4, 1])
    add(g, box, mat('#ffffff'), [0.1, 1.05, 0.42], [0.45, 0.9, 0.05])
    // i
    block(g, blue, 2.2, 0, 0.8, 2.2, 0.8)
    add(g, sphere, blue, [2.2, 2.9, 0], [0.9, 0.9, 0.9])
    scene.add(castAll(g))
  }

  /* ---------- districts ---------- */
  type District = { id: PersonaId; group: THREE.Group; ring: THREE.MeshStandardMaterial; base: THREE.Color; lift: number; liftTo: number }
  const districts: District[] = []
  const smoke: { mesh: THREE.Mesh; origin: THREE.Vector3; t: number }[] = []
  const trucks: { mesh: THREE.Group; t: number; speed: number }[] = []

  for (const spec of islands) {
    const d = DISTRICTS[spec.id]
    if (!d) continue
    const t = spec.theme
    const g = new THREE.Group()
    g.position.set(d.x, 0.3, d.z)
    g.userData.id = spec.id
    const ringMat = keep(new THREE.MeshStandardMaterial({ color: t.c1, roughness: 0.6, flatShading: true, emissive: t.c1, emissiveIntensity: 0 }))
    add(g, keep(plotGeometry(d.r + 0.5, d.x * 7, 0.12)), ringMat, [0, -0.02, 0])
    add(g, keep(plotGeometry(d.r, d.z * 5 + 3, 0.16)), mat('#eeebf3', { roughness: 1 }), [0, 0, 0])
    const top = 0.16
    const accent = mat(t.accent), c1 = mat(t.c1), c2 = mat(t.c2), c3 = mat(t.c3)
    const r = rng(Math.round(d.x * 13 + d.z * 7 + 99))
    // plaza trees on every plot
    for (let k = 0; k < 6; k++) {
      const a = r() * Math.PI * 2, rr = d.r - 0.9
      add(g, cone, mat('#3aa865'), [Math.cos(a) * rr, top + 0.6, Math.sin(a) * rr * 0.9], [0.7, 1.2, 0.7])
    }

    if (spec.id === 'founder') {
      // launch pad and rocket
      add(g, cyl, dark, [-2.4, top + 0.1, -1.4], [2.4, 0.2, 2.4])
      const rocket = new THREE.Group(); rocket.position.set(-2.4, top + 0.2, -1.4)
      add(rocket, cyl, white, [0, 1.6, 0], [0.7, 2.8, 0.7])
      add(rocket, cone, accent, [0, 3.45, 0], [0.7, 0.9, 0.7])
      add(rocket, cyl, c1, [0, 2.2, 0.33], [0.32, 0.06, 0.32]).rotation.x = Math.PI / 2
      for (let f = 0; f < 3; f++) { const fin = add(rocket, box, c3, [0, 0.45, 0], [0.06, 0.9, 0.55]); fin.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), (f * Math.PI * 2) / 3).add(new THREE.Vector3(Math.sin((f * Math.PI * 2) / 3) * 0.38, 0, Math.cos((f * Math.PI * 2) / 3) * 0.38)); fin.rotation.y = (f * Math.PI * 2) / 3 }
      g.add(rocket)
      // launch tower
      block(g, grey, -1.2, -1.4, 0.35, 3.6, 0.35, top)
      for (const y of [1, 2, 3]) block(g, grey, -1.7, -1.4, 0.8, 0.08, 0.1, top + y)
      // maker space with a sawtooth roof
      block(g, white, 1.6, 1.2, 3.2, 1.1, 2.2, top)
      for (let k = 0; k < 4; k++) add(g, prism, k % 2 ? c1 : accent, [0.4 + k * 0.8, top + 1.1, 1.2], [0.8, 0.55, 2.2])
      // the hoi workshop
      const hq = add(g, house, accent, [1.4, top, -1.8], [1.8, 2.3, 1.6])
      add(hq, box, white, [0, 0.55, 0.41], [0.2, 0.42, 0.04])
      // crane
      block(g, c3, 3.4, -1.4, 0.18, 4.2, 0.18, top)
      block(g, c3, 2.4, -1.4, 2.6, 0.16, 0.18, top + 4.05)
      block(g, white, 1.4, -1.4, 0.04, 1.2, 0.04, top + 2.9)
      // small startup houses
      for (let k = 0; k < 6; k++) {
        const a = -0.6 + k * 0.5, rr = 3.6 + (k % 2) * 0.6
        const h = add(g, house, [white, c1, white, c2][k % 4], [Math.cos(a + 1.9) * rr, top, Math.sin(a + 1.9) * rr], [0.7, 0.8 + (k % 3) * 0.2, 0.7], r() * 2)
        h.castShadow = true
      }
    } else if (spec.id === 'investor') {
      // glass towers with bands
      const towers: [number, number, number, number][] = [[-1.6, -1.2, 4.6, 1.1], [-0.2, -2, 6, 1.2], [1.3, -1.1, 3.8, 1], [0.5, 0.2, 2.8, 0.9]]
      for (const [x, z, h, w] of towers) {
        block(g, glass, x, z, w, h, w, top)
        for (let y = 0.5; y < h; y += 0.6) block(g, white, x, z, w + 0.04, 0.08, w + 0.04, top + y)
        block(g, accent, x, z, w * 0.7, 0.2, w * 0.7, top + h)
      }
      // the bank: steps, columns, roof, pediment
      const bank = new THREE.Group(); bank.position.set(-1, top, 2.2)
      block(bank, white, 0, 0, 3.4, 0.25, 2.2)
      for (let k = 0; k < 6; k++) add(bank, cyl, white, [-1.35 + k * 0.54, 0.85, 0.75], [0.24, 1.2, 0.24])
      block(bank, grey, 0, -0.25, 3, 1.2, 1.2, 0.25)
      block(bank, white, 0, 0, 3.4, 0.22, 2.2, 1.45)
      add(bank, prism, accent, [0, 1.67, 0], [3.4, 0.6, 2.2]).rotation.y = Math.PI / 2
      g.add(bank)
      // gold coin stacks
      for (const [x, z, n] of [[2.4, 1.6, 7], [3, 2.4, 5], [1.9, 2.6, 9]] as const) for (let k = 0; k < n; k++) add(g, cyl, gold, [x, top + 0.06 + k * 0.13, z], [0.7, 0.11, 0.7])
      // fountain plaza
      add(g, cyl, white, [2.6, top + 0.05, -1.6], [1.6, 0.12, 1.6])
      add(g, cyl, mat('#5e9cff', { roughness: 0.3 }), [2.6, top + 0.12, -1.6], [1.3, 0.04, 1.3])
    } else {
      // factory with sawtooth roofs and chimneys
      block(g, white, -0.8, -1.8, 4, 1.3, 2.6, top)
      for (let k = 0; k < 5; k++) add(g, prism, k % 2 ? grey : accent, [-2.4 + k * 0.8, top + 1.3, -1.8], [0.8, 0.6, 2.6])
      for (const x of [0.6, 1.4]) {
        add(g, cyl, white, [x, top + 1.9, -3.2], [0.45, 3.8, 0.45])
        add(g, cyl, accent, [x, top + 3.3, -3.2], [0.47, 0.35, 0.47])
        for (let k = 0; k < 4; k++) {
          const puff = add(scene, sphere, mat('#ffffff', { transparent: true, opacity: 0.85 }), [0, 0, 0], [0.5, 0.5, 0.5])
          smoke.push({ mesh: puff, origin: new THREE.Vector3(d.x + x, 0.3 + top + 3.9, d.z - 3.2), t: k / 4 })
        }
      }
      // warehouses
      for (const [x, z] of [[2.4, 0.6], [2.4, 2.2]] as const) { block(g, grey, x, z, 2.4, 0.9, 1.2, top); add(g, prism, c1, [x, top + 0.9, z], [1.2, 0.4, 2.4]).rotation.y = Math.PI / 2 }
      // container yard at the riverside, with a gantry crane
      const cont = [accent, c1, c2, white, mat('#ffb703'), c3]
      for (let k = 0; k < 18; k++) block(g, cont[k % cont.length], -3.6 + (k % 3) * 0.75, 0.2 + Math.floor(k / 6) * 0.4, 0.7, 0.32, 0.36, top + (Math.floor(k / 3) % 2) * 0.32)
      for (const z of [-0.6, 1.8]) block(g, accent, -5.2, z, 0.18, 2.8, 0.18, top)
      block(g, accent, -5.2, 0.6, 0.2, 0.2, 2.8, top + 2.8)
      block(g, accent, -6.4, 0.6, 3.6, 0.16, 0.2, top + 2.65)
      // offices
      block(g, glass, -1.6, 2.4, 1.6, 1.8, 1.4, top)
      block(g, white, -1.6, 2.4, 1.7, 0.1, 1.5, top + 1.8)
    }

    // trucks on the road between the bridge and the company
    if (spec.id === 'company') {
      for (let k = 0; k < 2; k++) {
        const tr = new THREE.Group()
        block(tr, white, 0, 0.3, 0.42, 0.42, 0.5)
        block(tr, accent, 0, -0.25, 0.4, 0.36, 0.42)
        scene.add(castAll(tr))
        trucks.push({ mesh: tr, t: 0.55 + k * 0.2, speed: k % 2 ? -0.018 : 0.018 })
      }
    }

    scene.add(castAll(g))
    districts.push({ id: spec.id, group: g, ring: ringMat, base: new THREE.Color(t.c1), lift: 0, liftTo: 0 })
  }

  /* ---------- boats ---------- */
  const riverCurve = new THREE.CatmullRomCurve3(RIVER.slice(0, 6).map(([x, z]) => new THREE.Vector3(x, -0.24, z)))
  const ship = new THREE.Group()
  block(ship, mat('#9a00ff'), 0, 0, 0.7, 0.3, 2, -0.1)
  const shipCont = ['#00d7b8', '#ffffff', '#003efe', '#ffb703']
  for (let k = 0; k < 6; k++) block(ship, mat(shipCont[k % 4]), k % 2 ? 0.17 : -0.17, -0.55 + Math.floor(k / 2) * 0.42, 0.3, 0.24, 0.38, 0.2)
  block(ship, white, 0, 0.75, 0.5, 0.45, 0.35, 0.2)
  scene.add(castAll(ship))
  const sailboats: { g: THREE.Group; a: number; r: number; cx: number; cz: number; speed: number }[] = []
  for (const [i, colr] of ['#00d7b8', '#ff5d8f', '#ffffff'].entries()) {
    const s = new THREE.Group()
    block(s, white, 0, 0, 0.3, 0.12, 0.9, -0.05)
    const sailGeo = keep(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1.1), new THREE.Vector2(0.6, 0)])))
    const sail = new THREE.Mesh(sailGeo, mat(colr, { side: THREE.DoubleSide }))
    sail.position.set(0, 0.08, 0.15); sail.rotation.y = Math.PI / 2
    s.add(sail)
    scene.add(castAll(s))
    sailboats.push({ g: s, a: i * 2.1, r: 6 + i * 3, cx: -6 + i * 9, cz: -19 + i * 1.5, speed: 0.05 + i * 0.015 })
  }

  /* ---------- the hoi blimp ---------- */
  const blimp = new THREE.Group()
  add(blimp, sphere, white, [0, 0, 0], [3.2, 1.2, 1.2]).geometry = keep(new THREE.SphereGeometry(0.5, 16, 10))
  add(blimp, box, mat('#9a00ff'), [-1.6, 0, 0], [0.5, 0.7, 0.06])
  add(blimp, box, mat('#9a00ff'), [-1.6, 0, 0], [0.5, 0.06, 0.7])
  add(blimp, box, dark, [0.2, -0.65, 0], [0.7, 0.22, 0.3])
  {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128
    const x = c.getContext('2d')!
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 512, 128)
    x.fillStyle = '#8a00e6'; x.font = '900 72px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'
    x.fillText('hoi startup factory', 256, 66)
    const tex = keep(new THREE.CanvasTexture(c)); tex.colorSpace = THREE.SRGBColorSpace
    const bannerMat = keep(new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
    const banner = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.6, 0.65)), bannerMat)
    banner.position.set(0, 0, 0.62)
    blimp.add(banner)
    const back = banner.clone(); back.position.z = -0.62; back.rotation.y = Math.PI; blimp.add(back)
  }
  scene.add(blimp)

  /* ---------- camera ---------- */
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableZoom = false
  controls.enablePan = false
  controls.minPolarAngle = 0.55
  controls.maxPolarAngle = 1.12
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }
  canvas.style.touchAction = 'pan-y' // vertical swipes keep scrolling the page

  /* Wide screens: the sea at the back. Tall screens: the land turned a quarter,
     so the three districts run down the screen. */
  let width = 1, height = 1
  const view = () => {
    const tall = width / height < 0.9
    const azimuth = tall ? -Math.PI / 2 : 0
    const target = tall ? new THREE.Vector3(2, 0, 3) : new THREE.Vector3(1.5, 0, 1.5)
    const halfAcross = tall ? 11 : 25 // what must fit across the screen
    const halfDeep = tall ? 25 : 14 // and up and down
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (width / height))
    const dist = Math.max(halfAcross / Math.tan(hfov / 2), (halfDeep * 0.72) / Math.tan(vfov / 2))
    return { target, azimuth, dist, polar: tall ? 0.8 : 0.95 }
  }
  const homeCam = (v = view()) => v.target.clone().add(new THREE.Vector3().setFromSphericalCoords(v.dist, v.polar, v.azimuth))
  const limits = (az: number) => { controls.minAzimuthAngle = az - 0.5; controls.maxAzimuthAngle = az + 0.5 }

  let flight: { from: THREE.Vector3; to: THREE.Vector3; fromCam: THREE.Vector3; toCam: THREE.Vector3; t0: number; ms: number } | null = null
  let atHome = true
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  function flyTo(id: PersonaId | null) {
    const dd = id ? DISTRICTS[id] : null
    atHome = !dd
    const v = view()
    const to = dd ? new THREE.Vector3(dd.x, 1, dd.z) : v.target
    const toCam = dd ? to.clone().add(new THREE.Vector3().subVectors(camera.position, controls.target).setLength(16)) : homeCam(v)
    if (opts.reduced) { controls.target.copy(to); camera.position.copy(toCam); controls.update(); return }
    flight = { from: controls.target.clone(), to, fromCam: camera.position.clone(), toCam, t0: performance.now(), ms: 1000 }
  }

  /* ---------- hover and picking ---------- */
  let hovered: PersonaId | null = null
  function hover(id: PersonaId | null) {
    hovered = id
    for (const d of districts) d.liftTo = d.id === id ? 1 : 0
  }
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  function pickAt(x: number, y: number) {
    ndc.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(districts.map((d) => d.group), true)[0]
    let o: THREE.Object3D | null = hit?.object ?? null
    while (o && !o.userData.id) o = o.parent
    return (o?.userData.id as PersonaId | undefined) ?? null
  }

  const anchors = districts.map((d) => ({ id: d.id, v: new THREE.Vector3(DISTRICTS[d.id].x, d.id === 'investor' ? 7.2 : 5.4, DISTRICTS[d.id].z) }))
  const tmp = new THREE.Vector3()
  function labelPositions() {
    const out: Partial<Record<PersonaId, { x: number; y: number }>> = {}
    for (const a of anchors) {
      tmp.copy(a.v).project(camera)
      if (tmp.z < 1) out[a.id] = { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height }
    }
    return out
  }

  /* ---------- animation ---------- */
  let interacting = false
  controls.addEventListener('start', () => { interacting = true; flight = null; atHome = false })
  controls.addEventListener('end', () => { interacting = false })
  const t0 = performance.now()
  let last = t0
  let shipT = 0.1, shipDir = 1
  const sph = new THREE.Spherical(), off = new THREE.Vector3()

  function place(time: number, dt: number) {
    rotors.forEach((r, i) => { r.rotation.z += dt * (1.2 + (i % 3) * 0.25) })
    shipT += dt * 0.02 * shipDir
    if (shipT > 0.95 || shipT < 0.02) shipDir *= -1
    const sp = riverCurve.getPointAt(shipT), st = riverCurve.getTangentAt(shipT)
    ship.position.copy(sp); ship.rotation.y = Math.atan2(st.x, st.z) + (shipDir < 0 ? Math.PI : 0)
    for (const s of sailboats) {
      const a = s.a + time * s.speed
      s.g.position.set(s.cx + Math.cos(a) * s.r, -0.28 + Math.sin(time * 1.6 + s.a) * 0.03, s.cz + Math.sin(a) * s.r * 0.35)
      s.g.rotation.y = -a
    }
    const ba = time * 0.04
    blimp.position.set(Math.sin(ba) * 24, 11 + Math.sin(time * 0.5) * 0.3, -6 + Math.cos(ba) * 6)
    blimp.rotation.y = -ba + (Math.cos(ba) > 0 ? 0 : Math.PI) + Math.PI / 2
    for (const p of smoke) {
      p.t = (p.t + dt * 0.18) % 1
      p.mesh.position.copy(p.origin).add(new THREE.Vector3(p.t * 1.4, p.t * 2.4, p.t * 0.3))
      p.mesh.scale.setScalar(0.35 + p.t * 0.9)
      ;(p.mesh.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - p.t)
    }
    const c = roadCurves[1]
    for (const tr of trucks) {
      tr.t += dt * tr.speed
      if (tr.t > 0.97) tr.t = 0.55
      if (tr.t < 0.55) tr.t = 0.97
      const p = c.getPointAt(tr.t), tan = c.getTangentAt(tr.t)
      const onBridge = p.distanceTo(BRIDGE) < 2.6
      tr.mesh.position.set(p.x, onBridge ? 0.48 : Math.max(groundHeight(p.x, p.z), 0.05) + 0.1, p.z)
      tr.mesh.rotation.y = Math.atan2(tan.x, tan.z) + (tr.speed < 0 ? Math.PI : 0)
    }
  }

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
    for (const d of districts) {
      d.lift += (d.liftTo - d.lift) * Math.min(1, dt * 10)
      d.group.position.y = 0.3 + d.lift * 0.35
      d.ring.emissiveIntensity = d.lift * 0.6
    }
    const time = (now - t0) / 1000
    if (!opts.reduced) {
      if (atHome && !interacting && !flight) {
        // a slow drift while nobody is touching it
        off.subVectors(camera.position, controls.target)
        sph.setFromVector3(off)
        const want = view().azimuth + Math.sin(time * 0.2) * 0.1
        sph.theta += (want - sph.theta) * 0.02
        camera.position.copy(controls.target).add(off.setFromSpherical(sph))
      }
      place(time, dt)
    } else if (!ship.userData.placed) { place(0, 0); ship.userData.placed = true }
    const fog = scene.fog as THREE.Fog
    const dist = camera.position.distanceTo(controls.target)
    fog.near = dist * 1.05; fog.far = dist * 2.3
    canvas.style.cursor = hovered ? '' : 'grab' // over a district: the hoi cursor (HoiCursor.tsx) takes over
    renderer.render(scene, camera)
  }

  function resize(w: number, h: number) {
    width = w; height = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w < 640 ? 38 : 30
    camera.updateProjectionMatrix()
    const v = view()
    limits(v.azimuth)
    if (atHome && !flight) { controls.target.copy(v.target); camera.position.copy(homeCam(v)); controls.update() }
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
