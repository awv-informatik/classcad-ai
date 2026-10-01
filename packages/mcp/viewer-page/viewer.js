// The ClassCAD viewer: one session's model, live.
//
// The part is drawn as the family draws it: the paper it lies on, by its lines — the
// B-rep edges and, for the view as it stands, the silhouettes of its curved faces —
// and lit a little, so a part turned by hand says which way a face looks (an even
// ground light and one lamp over the reader's left shoulder). Orthographic, Z up.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'

const $ = id => document.getElementById(id)
const base = location.pathname.replace(/\/+$/, '')
const app = $('app')
const stage = $('stage')
const canvas = $('canvas')

// ── the stage's colours, per theme (BRANDING.md, "The stage") ────────────────
const STAGE = {
  light: { ground: '#f3f4f7', body: '#ffffff', edge: '#0f1320' },
  dark: { ground: '#1b1e23', body: '#2b2f36', edge: '#dcdee3' },
}
const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

// ── three ───────────────────────────────────────────────────────────────────
const dpr = Math.min(2, window.devicePixelRatio || 1)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(dpr)
renderer.setClearColor(0x000000, 0)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e5, 1e5)
camera.up.set(0, 0, 1)
const holder = new THREE.Group()
scene.add(holder)

// A face that looks at the reader is paper; one that turns away falls off to a light
// grey, and no further. Shaded in display space, so the paper stays the paper's colour.
const faceUniforms = { uPaper: { value: new THREE.Color() }, uGround: { value: 0.78 }, uLamp: { value: 0.3 } }
const faceMaterial = opacity =>
  new THREE.ShaderMaterial({
    uniforms: { ...faceUniforms, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      attribute vec4 aColor;
      varying vec3 vNormal; varying vec4 vColor;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vColor = aColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uPaper; uniform float uGround; uniform float uLamp; uniform float uOpacity;
      varying vec3 vNormal; varying vec4 vColor;
      const vec3 LAMP = normalize(vec3(-0.45, 0.55, 0.7)); // over the reader's left shoulder, in view space
      void main() {
        vec3 n = normalize(vNormal);
        if (!gl_FrontFacing) n = -n;
        vec3 base = mix(uPaper, vColor.rgb, vColor.a);
        float light = min(1.0, uGround + uLamp * max(dot(n, LAMP), 0.0) * 1.25);
        gl_FragColor = vec4(base * light, uOpacity);
      }`,
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    depthWrite: opacity >= 1,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
const edgeMaterial = new LineMaterial({ color: 0x0f1320, linewidth: 1.4, transparent: true })

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = false
controls.zoomToCursor = true
controls.screenSpacePanning = true
controls.rotateSpeed = 0.9

let model = null // { bodies: [{ mesh, edges, sil, cands, inverse }], bounds }
let showEdges = true
let userMoved = false
let needsRender = true
let silDirty = true
controls.addEventListener('start', () => (userMoved = true))
controls.addEventListener('change', () => {
  needsRender = true
  silDirty = true
})

const fat = positions => {
  const g = new LineSegmentsGeometry()
  g.setPositions(positions.length ? positions : [0, 0, 0, 0, 0, 0])
  const l = new LineSegments2(g, edgeMaterial)
  l.frustumCulled = false
  l.renderOrder = 2
  return l
}

// Interior edges of curved faces with the normals of both triangles beside them: a
// silhouette is where one looks at the eye and the other does not.
function silhouetteCandidates(faces) {
  const out = []
  for (const f of faces) {
    if (f.flat) continue
    const v = f.p
    const idx = f.i
    const weld = new Map()
    const remap = new Uint32Array(v.length / 3)
    for (let i = 0; i < v.length / 3; i++) {
      const k = `${Math.round(v[3 * i] * 1000)},${Math.round(v[3 * i + 1] * 1000)},${Math.round(v[3 * i + 2] * 1000)}`
      if (!weld.has(k)) weld.set(k, i)
      remap[i] = weld.get(k)
    }
    const edges = new Map()
    const tn = []
    for (let t = 0; t < idx.length / 3; t++) {
      const a = remap[idx[3 * t]], b = remap[idx[3 * t + 1]], c = remap[idx[3 * t + 2]]
      const ux = v[3 * b] - v[3 * a], uy = v[3 * b + 1] - v[3 * a + 1], uz = v[3 * b + 2] - v[3 * a + 2]
      const wx = v[3 * c] - v[3 * a], wy = v[3 * c + 1] - v[3 * a + 1], wz = v[3 * c + 2] - v[3 * a + 2]
      let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx
      const len = Math.hypot(nx, ny, nz)
      if (len < 1e-9) { tn.push(null); continue }
      nx /= len; ny /= len; nz /= len
      tn.push([nx, ny, nz])
      for (const [p, q] of [[a, b], [b, c], [c, a]]) {
        const k = p < q ? p * 4294967296 + q : q * 4294967296 + p
        const e = edges.get(k)
        if (e) e.t2 = t
        else edges.set(k, { p, q, t1: t, t2: -1 })
      }
    }
    for (const e of edges.values()) {
      if (e.t2 < 0 || !tn[e.t1] || !tn[e.t2]) continue
      const n1 = tn[e.t1], n2 = tn[e.t2]
      if (n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2] > 0.99999) continue
      out.push(v[3 * e.p], v[3 * e.p + 1], v[3 * e.p + 2], v[3 * e.q], v[3 * e.q + 1], v[3 * e.q + 2], n1[0], n1[1], n1[2], n2[0], n2[1], n2[2])
    }
  }
  return new Float32Array(out)
}

function buildBody(body) {
  let nv = 0, ni = 0
  for (const f of body.faces) { nv += f.p.length / 3; ni += f.i.length }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 4)
  const index = new Uint32Array(ni)
  let vo = 0, io = 0, haveNormals = true
  for (const f of body.faces) {
    const n = f.p.length / 3
    pos.set(f.p, vo * 3)
    if (f.n) nor.set(f.n, vo * 3)
    else haveNormals = false
    const c = f.c ?? body.color // a colour of its own, or none: the paper's
    for (let i = 0; i < n; i++) {
      if (c) col.set([c[0] / 255, c[1] / 255, c[2] / 255, 1], (vo + i) * 4)
    }
    for (let i = 0; i < f.i.length; i++) index[io + i] = f.i[i] + vo
    vo += n
    io += f.i.length
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 4))
  g.setIndex(new THREE.BufferAttribute(index, 1))
  if (!haveNormals) g.computeVertexNormals()
  const segs = []
  for (const p of body.edges) for (let i = 0; i + 5 < p.length; i += 3) segs.push(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5])
  return { geometry: g, segments: segs, cands: silhouetteCandidates(body.faces), opacity: body.opacity ?? 1 }
}

function setModel(data) {
  for (const o of [...holder.children]) {
    holder.remove(o)
    o.traverse?.(x => x.geometry?.dispose?.())
  }
  model = null
  if (!data.bodies.length) return
  const built = data.bodies.map(buildBody)
  const parts = []
  for (const pl of data.placements) {
    const b = built[pl.body]
    const group = new THREE.Group()
    const m = new THREE.Matrix4().set(...pl.m)
    group.matrixAutoUpdate = false
    group.matrix.copy(m)
    const mesh = new THREE.Mesh(b.geometry, faceMaterial(b.opacity))
    const edges = fat(b.segments)
    const sil = fat([])
    group.add(mesh, edges, sil)
    holder.add(group)
    parts.push({ group, edges, sil, cands: b.cands, normalToLocal: new THREE.Matrix3().setFromMatrix4(m).invert() })
  }
  holder.updateMatrixWorld(true)
  const box = data.bounds ? new THREE.Box3(new THREE.Vector3(...data.bounds.min), new THREE.Vector3(...data.bounds.max)) : new THREE.Box3().setFromObject(holder)
  model = { parts, box }
  silDirty = true
  needsRender = true
}

// Silhouettes for the view as it stands. On a heavy model, once it rests.
const HEAVY = 400_000
let silTimer = 0
function updateSilhouettes(force) {
  if (!model || !showEdges) return
  const total = model.parts.reduce((s, p) => s + p.cands.length, 0)
  if (!force && total > HEAVY) {
    clearTimeout(silTimer)
    silTimer = setTimeout(() => { updateSilhouettes(true); needsRender = true }, 140)
    return
  }
  const dir = new THREE.Vector3()
  camera.getWorldDirection(dir).negate() // toward the eye
  for (const p of model.parts) {
    const d = dir.clone().applyMatrix3(p.normalToLocal)
    const c = p.cands
    const out = []
    for (let i = 0; i < c.length; i += 12) {
      const d1 = c[i + 6] * d.x + c[i + 7] * d.y + c[i + 8] * d.z
      const d2 = c[i + 9] * d.x + c[i + 10] * d.y + c[i + 11] * d.z
      if (d1 * d2 < 0) out.push(c[i], c[i + 1], c[i + 2], c[i + 3], c[i + 4], c[i + 5])
    }
    p.sil.geometry.dispose()
    p.sil.geometry = new LineSegmentsGeometry()
    p.sil.geometry.setPositions(out.length ? out : [0, 0, 0, 0, 0, 0])
    p.sil.visible = showEdges && out.length > 0
  }
}

// ── the view ────────────────────────────────────────────────────────────────
const VIEWS = { iso: [38, 35.2644], front: [0, 0], top: [0, 90], right: [90, 0] }
let size = 100 // how much of the world the view is tall, mm

function frame(az, el, animate = true) {
  const box = model?.box
  const center = box ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3()
  const radius = box ? Math.max(box.getSize(new THREE.Vector3()).length() / 2, 1e-3) : 50
  const a = THREE.MathUtils.degToRad(az)
  const e = THREE.MathUtils.degToRad(Math.min(el, 89.999))
  const back = new THREE.Vector3(Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e))
  const to = { position: center.clone().addScaledVector(back, radius * 4 + 100), target: center, size: radius * 2.5 }
  const from = { position: camera.position.clone(), target: controls.target.clone(), size }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const t0 = performance.now()
  const dur = animate && !reduced ? 320 : 0
  const step = now => {
    const k = dur ? Math.min(1, (now - t0) / dur) : 1
    const s = 1 - Math.pow(1 - k, 3)
    camera.position.lerpVectors(from.position, to.position, s)
    controls.target.lerpVectors(from.target, to.target, s)
    size = from.size + (to.size - from.size) * s
    camera.zoom = 1
    lens()
    camera.up.set(0, 0, 1)
    camera.lookAt(controls.target)
    controls.update()
    needsRender = true
    silDirty = true
    if (k < 1) requestAnimationFrame(step)
  }
  step(t0)
}

function lens() {
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1
  const hh = size / 2, hw = (hh * w) / h
  camera.left = -hw; camera.right = hw; camera.top = hh; camera.bottom = -hh
  camera.updateProjectionMatrix()
}

function resize() {
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1
  renderer.setSize(w, h, false)
  edgeMaterial.resolution.set(w, h)
  lens()
  needsRender = true
}
new ResizeObserver(resize).observe(stage)

// the part's three axes, as the eye sees them
const triad = { x: $('triad-x'), y: $('triad-y'), z: $('triad-z'), lx: $('triad-lx'), ly: $('triad-ly'), lz: $('triad-lz') }
function drawTriad() {
  const q = camera.quaternion.clone().invert()
  for (const [k, v] of [['x', new THREE.Vector3(1, 0, 0)], ['y', new THREE.Vector3(0, 1, 0)], ['z', new THREE.Vector3(0, 0, 1)]]) {
    v.applyQuaternion(q)
    triad[k].setAttribute('x2', (v.x * 17).toFixed(2))
    triad[k].setAttribute('y2', (-v.y * 17).toFixed(2))
    triad['l' + k].setAttribute('x', (v.x * 25).toFixed(2))
    triad['l' + k].setAttribute('y', (-v.y * 25).toFixed(2))
    triad[k].style.opacity = triad['l' + k].style.opacity = v.z < -0.01 ? 0.45 : 1
  }
}

let pale = 1 // while the part rebuilds, its lines pale to 45%
function loop() {
  requestAnimationFrame(loop)
  if (pale < 1) {
    pale = Math.min(1, pale + 0.035)
    edgeMaterial.opacity = pale
    needsRender = true
  }
  if (!needsRender) return
  needsRender = false
  if (silDirty) {
    silDirty = false
    updateSilhouettes(false)
  }
  drawTriad()
  renderer.render(scene, camera)
}

function applyTheme() {
  const c = STAGE[theme()]
  faceUniforms.uPaper.value.set(c.body)
  // ShaderMaterial writes display values: undo three's conversion of the hex to linear
  faceUniforms.uPaper.value.convertLinearToSRGB()
  edgeMaterial.color.set(c.edge)
  $('theme').setAttribute('aria-pressed', String(theme() === 'dark'))
  needsRender = true
}

// ── the chrome ──────────────────────────────────────────────────────────────
const fmt = n => n.toLocaleString('en-US')
const mm = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(/\.0$/, '')
const call = (kind, sceneKind) => `${sceneKind === 'ASSEMBLY' ? 'assembly' : 'part'}.${kind.charAt(0).toLowerCase()}${kind.slice(1)}`
const el = (tag, cls, text) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}

function setChrome(payload) {
  const s = payload.scene
  const name = s.name || (s.kind === 'EMPTY' ? 'No model' : 'Untitled')
  document.title = s.kind === 'EMPTY' ? 'ClassCAD' : `${name} · ClassCAD`
  $('kind').textContent = s.kind === 'ASSEMBLY' ? 'Assembly' : 'Part'
  $('name').textContent = name
  $('hud').textContent = s.kind === 'EMPTY' ? '' : `${s.kind === 'ASSEMBLY' ? 'Assembly' : 'Part'} · ${name}`

  const features = $('features')
  features.replaceChildren()
  $('feature-count').textContent = s.features.length || ''
  if (!s.features.length) features.append(el('p', 'empty', s.kind === 'ASSEMBLY' ? 'An assembly has no features of its own.' : 'No features yet. What the agent builds is listed here.'))
  for (const f of s.features) {
    const row = el('li', 'row')
    row.append(el('span', 'row__no', String(f.no).padStart(2, '0')), el('span', 'row__name', f.name), el('span', 'call', call(f.kind, s.kind)))
    features.append(row)
  }

  const bodies = $('bodies')
  bodies.replaceChildren()
  $('body-count').textContent = s.placements.length || ''
  if (!s.placements.length) bodies.append(el('p', 'empty', 'No bodies yet. A feature that makes one puts it here.'))
  for (const pl of s.placements) {
    const b = s.bodies[pl.body]
    const row = el('li', 'row')
    const sw = el('span', 'row__swatch')
    sw.style.background = b.color ? `rgb(${b.color.join(',')})` : STAGE[theme()].body
    sw.dataset.paper = b.color ? '' : '1'
    row.append(sw, el('span', 'row__name', b.name))
    bodies.append(row)
  }

  $('s-bodies').textContent = fmt(s.stats.bodies)
  $('s-faces').textContent = fmt(s.stats.faces)
  $('s-tris').textContent = fmt(s.stats.triangles)
  const extent = $('s-size')
  extent.replaceChildren()
  if (s.bounds) {
    const d = s.bounds.max.map((v, i) => v - s.bounds.min[i])
    extent.append(`${mm(d[0])} × ${mm(d[1])} × ${mm(d[2])} `, el('span', 'unit', 'mm'))
  } else extent.textContent = '–'
  $('s-host').textContent = payload.host || '–'
  $('engine').textContent = `ClassCAD · ${payload.engine}`
}

const clock = () => new Date().toLocaleTimeString('en-GB')
let version = -1
let loading = null
async function load() {
  if (loading) return loading
  loading = (async () => {
    $('dot').dataset.state = 'working'
    try {
      const res = await fetch(`${base}/scene`, { cache: 'no-store' })
      if (res.status === 404) return ended()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = await res.json()
      if (payload.version === version) return
      const first = version < 0
      version = payload.version
      const wasEmpty = !model
      setModel(payload.scene)
      setChrome(payload)
      app.dataset.state = payload.scene.bodies.length ? 'ready' : 'empty'
      $('doing').textContent = payload.scene.bodies.length ? `live · updated ${clock()}` : 'live · waiting for the first body'
      if (model && (first || wasEmpty || !userMoved)) frame(...VIEWS.iso, !first && !wasEmpty)
      if (!first && model) pale = 0.45
      needsRender = true
    } finally {
      $('dot').dataset.state = ''
      loading = null
    }
  })()
  return loading
}

function ended(text) {
  $('scrim').hidden = false
  if (text) $('scrim-text').textContent = text
  $('dot').dataset.state = 'off'
  $('doing').textContent = 'the session has ended'
  if (app.dataset.state === 'loading') app.dataset.state = 'empty'
  events?.close()
  // nothing is left to ask for a file
  closeMenu()
  exportButton.disabled = true
}

let events = null
let misses = 0
function listen() {
  events = new EventSource(`${base}/events`)
  events.addEventListener('hello', () => {
    misses = 0
    $('scrim').hidden = true
    load().catch(() => {})
  })
  events.addEventListener('scene', () => load().catch(() => {}))
  events.addEventListener('closed', () => ended())
  events.onerror = () => {
    // the browser retries by itself; after a few misses the session is gone
    if (++misses >= 3) ended('The ClassCAD MCP behind this view is no longer running. What you see is its last model.')
  }
}

// theme: follows the system until its reader picks the other one
$('theme').addEventListener('click', () => {
  const next = theme() === 'dark' ? 'light' : 'dark'
  const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  try {
    if (next === system) localStorage.removeItem('classcad-mcp:theme')
    else localStorage.setItem('classcad-mcp:theme', next)
  } catch {}
  document.documentElement.dataset.theme = next
  applyTheme()
  for (const sw of document.querySelectorAll('.row__swatch[data-paper="1"]')) sw.style.background = STAGE[next].body
})
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let pick = null
  try { pick = localStorage.getItem('classcad-mcp:theme') } catch {}
  if (pick) return
  document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'
  applyTheme()
})

// the view's dock
for (const b of document.querySelectorAll('[data-view]')) {
  b.addEventListener('click', () => {
    userMoved = true
    frame(...VIEWS[b.dataset.view])
  })
}
$('fit').addEventListener('click', () => {
  userMoved = false
  frame(...VIEWS.iso)
})
$('edges').addEventListener('click', e => {
  showEdges = !showEdges
  e.currentTarget.setAttribute('aria-pressed', String(showEdges))
  for (const p of model?.parts ?? []) p.edges.visible = showEdges
  for (const p of model?.parts ?? []) p.sil.visible = showEdges
  silDirty = true
  needsRender = true
})

// export: the model as a file
const exportButton = $('export-button')
const exportList = document.querySelector('#export .menu__list')
const closeMenu = () => {
  exportList.hidden = true
  exportButton.setAttribute('aria-expanded', 'false')
}
exportButton.addEventListener('click', e => {
  e.stopPropagation()
  exportList.hidden = !exportList.hidden
  exportButton.setAttribute('aria-expanded', String(!exportList.hidden))
})
document.addEventListener('click', closeMenu)
document.addEventListener('keydown', e => e.key === 'Escape' && closeMenu())
for (const a of document.querySelectorAll('[data-export]')) {
  a.addEventListener('click', e => {
    e.preventDefault()
    const name = ($('name').textContent || 'model').trim().replace(/[^A-Za-z0-9._ -]/g, '_') || 'model'
    const link = document.createElement('a')
    link.href = `${base}/export/${encodeURIComponent(name)}.${a.dataset.export}`
    link.download = `${name}.${a.dataset.export}`
    document.body.append(link)
    link.click()
    link.remove()
    closeMenu()
  })
}

// tooltips: dark chrome, after a moment
const tip = $('tip')
let tipTimer = 0
for (const t of document.querySelectorAll('[data-tip]')) {
  t.addEventListener('pointerenter', () => {
    clearTimeout(tipTimer)
    tipTimer = setTimeout(() => {
      tip.textContent = t.dataset.tip
      tip.hidden = false
      const r = t.getBoundingClientRect()
      const w = tip.offsetWidth
      tip.style.left = `${Math.max(8, r.left - w - 8)}px`
      tip.style.top = `${r.top + r.height / 2 - tip.offsetHeight / 2}px`
    }, 350)
  })
  t.addEventListener('pointerleave', () => {
    clearTimeout(tipTimer)
    tip.hidden = true
  })
}

applyTheme()
resize()
loop()
listen()
load().catch(() => ended('This view could not reach the ClassCAD MCP. Ask your agent for the current link.'))
window.__viewer = { get version() { return version }, get model() { return model }, camera }
