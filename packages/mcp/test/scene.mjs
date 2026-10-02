// Viewer scene contract — runs on every build (postbuild). Offline: buildScene
// is a pure function of a structure tree and a graphic payload.
//   1. the bodies drawn are the LIVE ones, solids and sheets (open bodies);
//      a body a later feature consumed is left out, whatever its class
//   2. a seam is no line of the part, the free rim of a sheet is
//   3. in an assembly a sheet is placed like a solid
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildScene } from '../dist/viewer/scene.js'

const part = (...children) => ({ id: 20, class: 'CC_Part', name: 'Part', parent: 1, children })
const body = (id, cls, consumed = 0, parent = 20) => ({ id, class: cls, name: `${cls}_${id}`, parent, members: { consumed: { value: consumed } } })
const tree = (...nodes) => Object.fromEntries(nodes.map(n => [n.id, n]))

/** One planar face: four corners, its loop of edge ids. */
const quad = (id, [a, b, c, d], loop) => ({ id, vertices: [a, b, c, d].flat(), normals: Array(4).fill([0, 0, 1]).flat(), indices: [0, 1, 2, 0, 2, 3], loops: [loop], properties: { surface: { type: 'plane' } } })
const line = (id, a, b) => ({ id, points: [...a, ...b] })

/** A square tube, 10 wide and 10 high, no caps: 4 walls, 4 vertical edges, 8 rim edges. */
function tube(owner) {
  const P = [[0, 0], [10, 0], [10, 10], [0, 10]]
  const meshes = [], edges = []
  for (let k = 0; k < 4; k++) {
    const [x0, y0] = P[k], [x1, y1] = P[(k + 1) % 4]
    // edge ids: vertical 10+k (shared with the next wall), bottom rim 20+k, top rim 30+k
    meshes.push(quad(1 + k, [[x0, y0, 0], [x1, y1, 0], [x1, y1, 10], [x0, y0, 10]], [10 + k, 20 + k, 10 + ((k + 1) % 4), 30 + k]))
    edges.push(line(10 + k, [x0, y0, 0], [x0, y0, 10]), line(20 + k, [x0, y0, 0], [x1, y1, 0]), line(30 + k, [x0, y0, 10], [x1, y1, 10]))
  }
  return { id: 100, owner, type: 1, properties: {}, meshes, edges }
}

/** An edge as the engine samples it: points ON the circle, and not where the mesh under it has its vertices. */
const arc = (r, z, segments, sweep = 2 * Math.PI) => Array.from({ length: segments + 1 }, (_, k) => [r * Math.cos((sweep * k) / segments), r * Math.sin((sweep * k) / segments), z]).flat()

/**
 * A surface of revolution about z, meshed as U strips by V rows over `sweep`: radius(v) at
 * height h·v. A full turn repeats its first column — the seam, closed by position.
 */
function revolved({ U = 12, V = 1, h = 10, sweep = 2 * Math.PI, radius = () => 5, type = 'cylinder', loop }) {
  const at = (j, i) => [radius(i / V) * Math.cos((sweep * j) / U), radius(i / V) * Math.sin((sweep * j) / U), (h * i) / V]
  const vertices = [], indices = []
  for (let j = 0; j <= U; j++) for (let i = 0; i <= V; i++) vertices.push(...at(sweep === 2 * Math.PI ? j % U : j, i))
  const n = (j, i) => j * (V + 1) + i
  for (let j = 0; j < U; j++) for (let i = 0; i < V; i++) indices.push(n(j, i), n(j + 1, i), n(j + 1, i + 1), n(j, i), n(j + 1, i + 1), n(j, i + 1))
  const normals = vertices.map((x, k) => (k % 3 === 2 ? 0 : x / Math.hypot(vertices[k - (k % 3)], vertices[k - (k % 3) + 1])))
  return { id: 1, vertices, normals, indices, loops: [loop], properties: { surface: { type } } }
}

/** A cylinder, with or without caps: seam 1, bottom circle 2, top circle 3. The circles are sampled finer than the mesh. */
function cylinder(owner, caps, { U = 12, r = 5, h = 10 } = {}) {
  const ring = z => arc(r, z, U)
  const cap = (id, z, loop) => ({ id, vertices: [0, 0, z, ...ring(z)], normals: Array(U + 2).fill([0, 0, 1]).flat(), indices: Array.from({ length: U }, (_, k) => [0, k + 1, k + 2]).flat(), loops: [[loop]], properties: { surface: { type: 'plane' } } })
  const shell = revolved({ U, h, radius: () => r, loop: [1, 2, 3] })
  return {
    id: 100, owner, type: 1, properties: {},
    meshes: caps ? [shell, cap(2, 0, 2), cap(3, h, 3)] : [shell],
    edges: [{ id: 1, points: [r, 0, 0, r, 0, h] }, { id: 2, points: arc(r, 0, 53) }, { id: 3, points: arc(r, h, 53) }],
  }
}

/** A barrel without caps: its seam is a curve (edge 1, sampled finer than the mesh), its rims two circles. */
function barrel(owner, { r = 5, bulge = 2, h = 10 } = {}) {
  const radius = v => r + bulge * Math.sin(Math.PI * v)
  const seam = Array.from({ length: 33 }, (_, k) => [radius(k / 32), 0, (h * k) / 32]).flat()
  return {
    id: 100, owner, type: 1, properties: {},
    meshes: [revolved({ U: 12, V: 6, h, radius, type: 'nurbsSurface', loop: [1, 2, 3] })],
    edges: [{ id: 1, points: seam }, { id: 2, points: arc(r, 0, 53) }, { id: 3, points: arc(r, h, 53) }],
  }
}

/** A flat wall closed by half a pipe: 2 straight edges between the two faces, 2 straight rims on the wall, 2 arcs on the pipe. */
function dee(owner, { r = 5, h = 10 } = {}) {
  const wall = quad(2, [[r, 0, 0], [-r, 0, 0], [-r, 0, h], [r, 0, h]], [10, 11, 12, 13])
  return {
    id: 100, owner, type: 1, properties: {},
    meshes: [wall, revolved({ U: 8, h, sweep: Math.PI, radius: () => r, loop: [10, 20, 12, 21] })],
    edges: [
      line(10, [r, 0, 0], [r, 0, h]), line(12, [-r, 0, 0], [-r, 0, h]), line(11, [r, 0, 0], [-r, 0, 0]), line(13, [r, 0, h], [-r, 0, h]),
      { id: 20, points: arc(r, 0, 32, Math.PI) }, { id: 21, points: arc(r, h, 32, Math.PI) },
    ],
  }
}

test('scene: live bodies only — solids and sheets; a consumed sheet is left out', () => {
  const t = tree(part(30, 31, 32), body(30, 'CC_Solid'), body(31, 'CC_Sheet', 1), body(32, 'CC_Sheet'))
  const scene = buildScene(t, { containers: [cylinder(30, true), { ...tube(31), id: 101 }, { ...tube(32), id: 102 }] })
  assert.deepEqual(scene.bodies.map(b => b.id), [30, 32], 'the consumed sheet 31 is not a body of the scene')
  assert.equal(scene.kind, 'PART')
  assert.equal(scene.placements.length, 2)
})

test('scene: a seam is dropped, the free rim of a sheet is drawn', () => {
  const sheet = tree(part(30), body(30, 'CC_Sheet'))
  const solid = tree(part(30), body(30, 'CC_Solid'))
  const edges = (t, container) => buildScene(t, { containers: [container] }).bodies[0].edges
  const circles = (kept, what) => {
    assert.equal(kept.length, 2, `${what}: both rim circles, not the seam`)
    assert.ok(kept.every(e => e.length === 54 * 3), `${what}: the two edges kept are the circles`)
  }
  // an open tube: 4 corner edges between two walls each, and 8 rim edges that border one flat wall
  assert.equal(edges(sheet, tube(30)).length, 12, 'all 12 edges of a sheet tube')
  // a pipe: the circles are rims, the seam is not an edge. Edge and mesh are sampled apart, as the engine sends them
  circles(edges(sheet, cylinder(30, false)), 'a sheet cylinder')
  // ...also where the seam is short and the mesh coarse: a wide band, its seam nearer to the rims than a mesh edge is long
  circles(edges(sheet, cylinder(30, false, { U: 48, r: 50, h: 2 })), 'a wide sheet band')
  // ...and where the seam is a curve, which the mesh follows in chords
  circles(edges(sheet, barrel(30)), 'a sheet barrel')
  // a curved face that does not close has no seam: half a pipe on a flat wall keeps its two arcs
  assert.equal(edges(sheet, dee(30)).length, 6, 'all 6 edges of a wall with half a pipe')
  // the same shell closed by caps: the circles lie between two faces, the seam still borders one
  circles(edges(solid, cylinder(30, true)), 'a solid cylinder')
  // only a sheet has rims: in a solid an edge of one face is a seam, wherever it runs
  assert.equal(edges(solid, cylinder(30, false)).length, 0, 'a solid is not asked for rims')
  // without loops there is nothing to tell a seam by: every edge is drawn
  const bare = cylinder(30, true)
  for (const m of bare.meshes) delete m.loops
  assert.equal(edges(solid, bare).length, 3)
})

test('scene: in an assembly a sheet is placed like a solid', () => {
  const cs = x => [[x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const t = tree(
    { id: 10, class: 'CC_AssemblyRoot', name: 'Root', parent: 1, children: [11, 12] },
    { id: 11, class: 'CC_ProductReference', name: 'A', parent: 10, members: { productId: { value: 20 } }, coordinateSystem: cs(0) },
    { id: 12, class: 'CC_ProductReference', name: 'B', parent: 10, members: { productId: { value: 21 } }, coordinateSystem: cs(40) },
    { ...part(30), parent: 10 },
    { id: 21, class: 'CC_Part', name: 'SheetPart', parent: 10, children: [31, 32] },
    body(30, 'CC_Solid'), body(31, 'CC_Sheet', 1, 21), body(32, 'CC_Sheet', 0, 21),
  )
  const scene = buildScene(t, { containers: [cylinder(30, true), { ...tube(31), id: 101 }, { ...tube(32), id: 102 }] })
  assert.equal(scene.kind, 'ASSEMBLY')
  assert.deepEqual(scene.placements.map(p => [scene.bodies[p.body].id, p.m[3]]), [[30, 0], [32, 40]], 'the solid at 0, the live sheet at 40, no consumed sheet')
  assert.deepEqual(scene.bounds, { min: [-5, -5, 0], max: [50, 10, 10] })
})
