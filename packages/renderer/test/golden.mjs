// Golden-hash guard: the DEFAULT render output must not change across the
// feature refactors. Run `node test/golden.mjs record` once, then plain runs compare.
import { createHash } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { renderSessionData } from '../src/core.mjs'

// Same synthetic cube as smoke.mjs
function cubeGraphic(size = 10) {
  const s = size
  const V = [[0,0,0],[s,0,0],[s,s,0],[0,s,0],[0,0,s],[s,0,s],[s,s,s],[0,s,s]]
  const quads = [[0,3,2,1,[0,0,-1]],[4,5,6,7,[0,0,1]],[0,1,5,4,[0,-1,0]],[2,3,7,6,[0,1,0]],[1,2,6,5,[1,0,0]],[0,4,7,3,[-1,0,0]]]
  const vertices = [], normals = [], indices = []
  let vi = 0
  for (const [a,b,c,d,n] of quads) {
    for (const idx of [a,b,c,d]) { vertices.push(...V[idx]); normals.push(...n) }
    indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3); vi += 4
  }
  return { containers: [{ id: 100, owner: 30, type: 1,
    properties: { material: { color: [140, 160, 250], opacity: 1 }, layer: '0' },
    meshes: [{ id: 1, vertices, normals, indices }],
    edges: [{ id: 2, points: [0,0,0, s,0,0, s,s,0, 0,s,0, 0,0,0] }] }], properties: { version: 9 } }
}
const tree = {
  '20': { id: 20, class: 'CC_Part', name: 'Part', parent: null, children: [30] },
  '30': { id: 30, class: 'CC_Solid', name: 'Solid', parent: 20 },
}
const goldenPath = new URL('./golden.json', import.meta.url).pathname
const hashes = {}
for (const view of ['iso', 'front', 'top']) {
  for (const colors of ['native', 'distinct']) {
    const [e] = await renderSessionData({ tree, graphic: cubeGraphic() }, { width: 320, height: 240, view, colors })
    hashes[`${view}/${colors}`] = createHash('sha256').update(e.pixels).digest('hex').slice(0, 16)
  }
}
if (process.argv[2] === 'record' || !existsSync(goldenPath)) {
  writeFileSync(goldenPath, JSON.stringify(hashes, null, 2))
  console.log('golden recorded:', hashes)
} else {
  const want = JSON.parse(readFileSync(goldenPath, 'utf8'))
  const bad = Object.keys(want).filter(k => want[k] !== hashes[k])
  if (bad.length) { console.error('GOLDEN MISMATCH:', bad.map(k => `${k}: ${want[k]} → ${hashes[k]}`)); process.exit(1) }
  console.log('GOLDEN OK —', Object.keys(want).length, 'default renders unchanged')
}
