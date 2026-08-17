// 03 — a mesh grid of lines -> extract the OUTER boundary via the boundary test with the bounding rect as the
// target region. Lines render correctly, so before/after snapshots are reliable here.
import { makeSketch, line, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const srcMap = {}
  // 4 horizontals + 4 verticals, each spanning 0..90 -> 3x3 mesh
  for (const y of [0, 30, 60, 90]) { const id = await line(api, skId, [0, y, 0], [90, y, 0]); srcMap[id] = { type: 'line' } }
  for (const x of [0, 30, 60, 90]) { const id = await line(api, skId, [x, 0, 0], [x, 90, 0]); srcMap[id] = { type: 'line' } }
  await snapshot('03-before') // full mesh

  const shapes = [{ kind: 'rect', a: [0, 0], b: [90, 90] }]
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const totalSegs = pre.result.flatMap(e => e.splittedCurves).length
  const { rows, keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.5 })
  filewrite({ totalSegs, keepCount: keep.length, trimCount: trim.length, rows }, '03-classify')
  console.log('[03] total segments', totalSegs, '| keep(boundary)', keep.length, '| trim(interior/exterior)', trim.length)

  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('03-after') // outer square

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push({ id, s: p.startPos, e: p.endPos }) }
  filewrite({ geo, survivors }, '03-result')
  console.log('[03] survivor lines', geo.lines.length, JSON.stringify(survivors.map(s => [s.s[0], s.s[1], '->', s.e[0], s.e[1]])))

  // survivors should be the 4 perimeter edges (coalesced): each spans a full side 0..90
  const isPerimeter = s => {
    const onBottom = Math.abs(s.s[1]) < 1e-6 && Math.abs(s.e[1]) < 1e-6
    const onTop = Math.abs(s.s[1] - 90) < 1e-6 && Math.abs(s.e[1] - 90) < 1e-6
    const onLeft = Math.abs(s.s[0]) < 1e-6 && Math.abs(s.e[0]) < 1e-6
    const onRight = Math.abs(s.s[0] - 90) < 1e-6 && Math.abs(s.e[0] - 90) < 1e-6
    return onBottom || onTop || onLeft || onRight
  }
  const checks = {
    fourSurvivors: geo.lines.length === 4,
    allPerimeter: survivors.every(isPerimeter),
  }
  console.log('[03] CHECKS', JSON.stringify(checks))
  console.log('[03]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
