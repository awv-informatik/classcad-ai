// viewer/scene.ts — what the 3D viewer draws, built from a session's
// structure tree and graphic exactly as the PNG renderer reads them: live
// solids only (a consumed body's container is stale), and in an assembly one
// placement per part instance.
import { extractAssemblyInstances, graphicWithEdges, isConsumedSolid } from '@classcad/renderer'

type Tree = Record<string, any>

export type SceneFace = {
  /** positions, flat xyz */
  p: number[]
  /** normals, flat xyz (same length as p), or null: the viewer computes them */
  n: number[] | null
  /** triangle indices */
  i: number[]
  /** a planar face has no silhouette */
  flat: boolean
  /** the face's own colour, when it differs from its body's */
  c?: [number, number, number]
}

export type SceneBody = {
  /** the solid's id in the structure tree */
  id: number
  name: string
  /** the colour the model gave the body, or null: it takes the paper's */
  color: [number, number, number] | null
  opacity: number
  faces: SceneFace[]
  /** B-rep edges as polylines, flat xyz */
  edges: number[][]
}

export type Scene = {
  kind: 'PART' | 'ASSEMBLY' | 'EMPTY'
  name: string
  bodies: SceneBody[]
  /** where each body is drawn: a row-major 4×4 per placement (identity in a part) */
  placements: { body: number; m: number[] }[]
  features: { no: number; name: string; kind: string }[]
  stats: { bodies: number; faces: number; triangles: number; edges: number }
  /** world bounds of everything placed, or null when empty */
  bounds: { min: [number, number, number]; max: [number, number, number] } | null
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/** The engine's colour for a body nobody coloured: such a body is drawn as paper. */
const ENGINE_DEFAULT = [[128, 128, 128]]
const rgb = (c: unknown): [number, number, number] | null => {
  if (!Array.isArray(c) || c.length < 3) return null
  // the engine sends 0–255; tolerate 0–1
  const scale = c.every(v => typeof v === 'number' && v <= 1) ? 255 : 1
  return [Math.round(c[0] * scale), Math.round(c[1] * scale), Math.round(c[2] * scale)]
}
const ownColor = (c: unknown): [number, number, number] | null => {
  const v = rgb(c)
  if (!v) return null
  return ENGINE_DEFAULT.some(d => d[0] === v[0] && d[1] === v[1] && d[2] === v[2]) ? null : v
}
const same = (a: number[] | null, b: number[] | null) => (a && b ? a[0] === b[0] && a[1] === b[1] && a[2] === b[2] : a === b)

/** 4 decimals: a tenth of a micron, and a third less JSON. */
const round = (a: ArrayLike<number>): number[] => {
  const out = new Array<number>(a.length)
  for (let i = 0; i < a.length; i++) out[i] = Math.round(a[i] * 1e4) / 1e4
  return out
}

/**
 * Features in build order. The operation sequence holds references
 * (`refObj` → the feature); the datums' references and the rollback bar are
 * not features.
 */
function features(tree: Tree): Scene['features'] {
  const out: Scene['features'] = []
  const seq = Object.values<any>(tree).find(n => n?.class === 'CC_OperationSequence')
  for (const id of seq?.children ?? []) {
    const ref = tree[String(id)]
    const target = tree[String(ref?.members?.refObj?.value)]
    if (!target || /^CC_(Work|RollbackBar)/.test(String(target.class ?? ''))) continue
    out.push({ no: out.length + 1, name: String(target.name ?? ''), kind: String(target.class ?? '').replace(/^CC_/, '') })
  }
  return out
}

export function buildScene(tree: Tree | null | undefined, graphic: { containers?: any[] } | null | undefined): Scene {
  const t = tree ?? {}
  // Analytic edges arrive as lines and arcs; as the renderer does, draw them as edges too.
  const containers = ((graphicWithEdges(graphic)?.containers ?? []) as any[]).filter((c: any) => (c?.meshes?.length ?? 0) > 0 && !isConsumedSolid(t as any, c.owner))
  const root = Object.values<any>(t).find(n => n?.class === 'CC_AssemblyRoot') ?? Object.values<any>(t).find(n => n?.class === 'CC_Part')
  const kind: Scene['kind'] = !root ? 'EMPTY' : root.class === 'CC_AssemblyRoot' ? 'ASSEMBLY' : 'PART'

  const bodies: SceneBody[] = []
  const bodyOfOwner = new Map<number, number>()
  let faces = 0
  let triangles = 0
  let edges = 0
  for (const c of containers) {
    const color = ownColor(c.properties?.material?.color)
    const body: SceneBody = {
      id: Number(c.owner ?? c.id),
      name: String(t[String(c.owner)]?.name ?? t[String(c.id)]?.name ?? 'Body'),
      color,
      opacity: typeof c.properties?.material?.opacity === 'number' ? c.properties.material.opacity : 1,
      faces: [],
      edges: [],
    }
    for (const m of c.meshes) {
      if (!m?.vertices?.length || !m?.indices?.length) continue
      const fc = ownColor(m.properties?.material?.color)
      body.faces.push({
        p: round(m.vertices),
        n: m.normals?.length === m.vertices.length ? round(m.normals) : null,
        i: Array.from(m.indices as ArrayLike<number>),
        flat: m.properties?.surface?.type === 'plane',
        ...(fc && !same(fc, color) ? { c: fc } : {}),
      })
      faces++
      triangles += m.indices.length / 3
    }
    // A seam is not a line of the part: it is where one curved face closes on
    // itself. An edge of a solid lies between two faces; a seam borders one.
    const borders = new Map<number, Set<number>>()
    for (const m of c.meshes) {
      for (const loop of m.loops ?? []) {
        for (const id of loop) {
          const faces = borders.get(id) ?? new Set<number>()
          faces.add(m.id)
          borders.set(id, faces)
        }
      }
    }
    const isSeam = (id: number) => borders.size > 0 && (borders.get(id)?.size ?? 0) < 2
    for (const e of c.edges ?? []) {
      if (e?.points?.length >= 6 && !isSeam(e.id)) {
        body.edges.push(round(e.points))
        edges++
      }
    }
    if (!body.faces.length) continue
    bodyOfOwner.set(body.id, bodies.length)
    bodies.push(body)
  }

  // An assembly draws each part's bodies once per instance; a part draws them where they are.
  const instances = kind === 'ASSEMBLY' ? extractAssemblyInstances(t as any) : null
  const placements: Scene['placements'] = []
  if (instances?.length) {
    for (const inst of instances) {
      const body = bodyOfOwner.get(Number(inst.ownerSolidId))
      if (body != null) placements.push({ body, m: inst.transform.map(Number) })
    }
  } else {
    bodies.forEach((_, body) => placements.push({ body, m: IDENTITY }))
  }

  // world bounds
  let bounds: Scene['bounds'] = null
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const pl of placements) {
    const m = pl.m
    for (const f of bodies[pl.body].faces) {
      for (let k = 0; k < f.p.length; k += 3) {
        const x = f.p[k], y = f.p[k + 1], z = f.p[k + 2]
        const w = [m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11]]
        for (let a = 0; a < 3; a++) {
          if (w[a] < min[a]) min[a] = w[a]
          if (w[a] > max[a]) max[a] = w[a]
        }
      }
    }
  }
  if (placements.length && Number.isFinite(min[0])) bounds = { min, max }

  return {
    kind: bodies.length || kind !== 'EMPTY' ? kind : 'EMPTY',
    name: String(root?.name ?? ''),
    bodies,
    placements,
    features: kind === 'PART' ? features(t) : [],
    stats: { bodies: placements.length, faces, triangles, edges },
    bounds,
  }
}

// ─── GLB ───────────────────────────────────────────────────────────────────

/**
 * The scene as binary glTF 2.0: one mesh per body, one node per placement,
 * Z up turned to glTF's Y up at the root. Bodies without a colour of their
 * own are white. Edges are not part of it (glTF viewers draw faces).
 */
export function sceneToGlb(scene: Scene): Buffer {
  const chunks: Buffer[] = []
  let offset = 0
  const bufferViews: any[] = []
  const accessors: any[] = []
  const push = (buf: Buffer, target: number): number => {
    const pad = (4 - (buf.length % 4)) % 4
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target })
    chunks.push(buf, Buffer.alloc(pad))
    offset += buf.length + pad
    return bufferViews.length - 1
  }

  const materials: any[] = []
  const materialOf = (c: [number, number, number] | null, opacity: number): number => {
    const col = c ?? [255, 255, 255]
    const key = `${col.join(',')}|${opacity}`
    let i = materials.findIndex(m => m.extras.key === key)
    if (i < 0) {
      const lin = (v: number) => Math.pow(v / 255, 2.2)
      materials.push({
        pbrMetallicRoughness: { baseColorFactor: [lin(col[0]), lin(col[1]), lin(col[2]), opacity], metallicFactor: 0, roughnessFactor: 0.8 },
        doubleSided: true,
        ...(opacity < 1 ? { alphaMode: 'BLEND' } : {}),
        extras: { key },
      })
      i = materials.length - 1
    }
    return i
  }

  const meshes = scene.bodies.map(body => {
    // one primitive per colour
    const groups = new Map<string, { color: [number, number, number] | null; faces: SceneFace[] }>()
    for (const f of body.faces) {
      const color = f.c ?? body.color
      const key = color ? color.join(',') : '-'
      const g = groups.get(key) ?? { color, faces: [] }
      g.faces.push(f)
      groups.set(key, g)
    }
    const primitives = [...groups.values()].map(g => {
      let nv = 0
      let ni = 0
      for (const f of g.faces) {
        nv += f.p.length / 3
        ni += f.i.length
      }
      const pos = new Float32Array(nv * 3)
      const nor = new Float32Array(nv * 3)
      const idx = new Uint32Array(ni)
      const lo = [Infinity, Infinity, Infinity]
      const hi = [-Infinity, -Infinity, -Infinity]
      let vo = 0
      let io = 0
      let normals = true
      for (const f of g.faces) {
        pos.set(f.p, vo * 3)
        if (f.n) nor.set(f.n, vo * 3)
        else normals = false
        for (let k = 0; k < f.i.length; k++) idx[io + k] = f.i[k] + vo
        for (let k = 0; k < f.p.length; k += 3) {
          for (let a = 0; a < 3; a++) {
            if (f.p[k + a] < lo[a]) lo[a] = f.p[k + a]
            if (f.p[k + a] > hi[a]) hi[a] = f.p[k + a]
          }
        }
        vo += f.p.length / 3
        io += f.i.length
      }
      const attributes: Record<string, number> = {}
      accessors.push({ bufferView: push(Buffer.from(pos.buffer), 34962), componentType: 5126, count: nv, type: 'VEC3', min: lo, max: hi })
      attributes.POSITION = accessors.length - 1
      if (normals) {
        accessors.push({ bufferView: push(Buffer.from(nor.buffer), 34962), componentType: 5126, count: nv, type: 'VEC3' })
        attributes.NORMAL = accessors.length - 1
      }
      accessors.push({ bufferView: push(Buffer.from(idx.buffer), 34963), componentType: 5125, count: ni, type: 'SCALAR' })
      return { attributes, indices: accessors.length - 1, material: materialOf(g.color, body.opacity), mode: 4 }
    })
    return { name: body.name, primitives }
  })

  // glTF matrices are column-major; ours are row-major. The root turns Z up into Y up, in metres.
  const columnMajor = (m: number[]) => [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]]
  const nodes: any[] = scene.placements.map(pl => ({ name: scene.bodies[pl.body].name, mesh: pl.body, matrix: columnMajor(pl.m) }))
  nodes.push({ name: scene.name || 'ClassCAD', children: nodes.map((_, i) => i), matrix: [0.001, 0, 0, 0, 0, 0, -0.001, 0, 0, 0.001, 0, 0, 0, 0, 0, 1] })

  const bin = Buffer.concat(chunks)
  const json = {
    asset: { version: '2.0', generator: 'ClassCAD MCP' },
    scene: 0,
    scenes: [{ nodes: [nodes.length - 1] }],
    nodes,
    meshes,
    materials: materials.map(({ extras, ...m }) => m),
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  }
  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8)
  const jsonHead = Buffer.alloc(8)
  jsonHead.writeUInt32LE(jsonBuf.length, 0)
  jsonHead.writeUInt32LE(0x4e4f534a, 4)
  const binHead = Buffer.alloc(8)
  binHead.writeUInt32LE(bin.length, 0)
  binHead.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jsonHead, jsonBuf, binHead, bin])
}
