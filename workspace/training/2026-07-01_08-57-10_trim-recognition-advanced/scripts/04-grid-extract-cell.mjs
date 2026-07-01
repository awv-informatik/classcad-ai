// 04 — from a 3x3 mesh, extract just the CENTER cell by using that cell's rect as the target region.
import { makeSketch, line, positions } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  const srcMap = {}
  for (const y of [0, 30, 60, 90]) { const id = await line(api, skId, [0, y, 0], [90, y, 0]); srcMap[id] = { type: 'line' } }
  for (const x of [0, 30, 60, 90]) { const id = await line(api, skId, [x, 0, 0], [x, 90, 0]); srcMap[id] = { type: 'line' } }
  await snapshot('04-before')

  const shapes = [{ kind: 'rect', a: [30, 30], b: [60, 60] }] // the center cell
  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.5 })
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('04-after')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const survivors = []
  for (const id of geo.lines) { const p = await positions(api, id); survivors.push([p.startPos[0], p.startPos[1], p.endPos[0], p.endPos[1]]) }
  filewrite({ keep: keep.length, trim: trim.length, survivors }, '04-result')
  console.log('[04] keep', keep.length, 'trim', trim.length, '| survivors', geo.lines.length, JSON.stringify(survivors))
  const inCell = s => s.every(v => v >= 30 - 1e-6 && v <= 60 + 1e-6)
  const checks = { fourSurvivors: geo.lines.length === 4, allOnCell: survivors.every(inCell) }
  console.log('[04] CHECKS', JSON.stringify(checks))
  console.log('[04]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
