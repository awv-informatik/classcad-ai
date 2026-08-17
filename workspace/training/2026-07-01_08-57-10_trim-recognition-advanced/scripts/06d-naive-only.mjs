// 06d — naive classifier ALONE on a single sketch: it should leave the two line-overhang STUBS (the failure mode).
import { makeSketch, circle, line, positions } from './_setup.mjs'
import { classifyNaive } from './_geo.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api)
  await circle(api, skId, [0, 0, 0], 50)
  await circle(api, skId, [60, 0, 0], 50)
  await line(api, skId, [-90, 0, 0], [150, 0, 0])
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { keep, trim } = await classifyNaive(api, pre.result, pre.structure?.tree, shapes)
  console.log('[06d] naive keep', JSON.stringify(keep), 'trim', JSON.stringify(trim))
  await api.v1.sketch.trim({ id: skId, curveIds: trim })
  await api.v1.sketch.postTrim({ id: skId })
  await snapshot('06d-naive')
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const lineDetails = []
  for (const id of geo.lines) { const p = await positions(api, id); lineDetails.push([p.startPos[0], p.startPos[1], '->', p.endPos[0], p.endPos[1]]) }
  filewrite({ keep, trim, geo, lineDetails }, '06d')
  console.log('[06d] survivors: lines', geo.lines.length, JSON.stringify(lineDetails), 'arcs', (geo.arcs || []).length)
  console.log('[06d]', geo.lines.length > 0 ? 'NAIVE FAILS — left dangling line stub(s) outside the shapes' : 'no stubs')
  return { lines: geo.lines.length, arcs: (geo.arcs || []).length }
}
