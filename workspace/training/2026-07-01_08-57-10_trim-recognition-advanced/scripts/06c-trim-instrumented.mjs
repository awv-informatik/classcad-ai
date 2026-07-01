// 06c — instrument the trim/postTrim of the boundary keep-set to see WHY survivors vanish.
import { makeSketch, circle, line, positions, firstError } from './_setup.mjs'
import { classify, UNION_OUTLINE } from './_geo.mjs'

export default async function (api, { filewrite }) {
  const { skId } = await makeSketch(api)
  await circle(api, skId, [0, 0, 0], 50)
  await circle(api, skId, [60, 0, 0], 50)
  await line(api, skId, [-90, 0, 0], [150, 0, 0])
  const shapes = [{ kind: 'circle', c: [0, 0], r: 50 }, { kind: 'circle', c: [60, 0], r: 50 }]

  const pre = await api.v1.sketch.preTrim({ id: skId })
  const { keep, trim } = await classify(api, pre.result, pre.structure?.tree, shapes, { keepRule: UNION_OUTLINE, eps: 0.3 })
  console.log('[06c] keep', JSON.stringify(keep), 'trim', JSON.stringify(trim))
  // are the keep ids alive before trim?
  for (const id of keep) console.log('[06c] pre-trim keep', id, 'getPositions maxLevel', (await positions(api, id)).maxLevel)

  const rTrim = await api.v1.sketch.trim({ id: skId, curveIds: trim })
  console.log('[06c] trim maxLevel', rTrim.maxLevel, 'err', JSON.stringify(firstError(rTrim)))
  // keep ids alive after trim, before postTrim?
  for (const id of keep) console.log('[06c] post-trim keep', id, 'getPositions maxLevel', (await positions(api, id)).maxLevel)

  const rPost = await api.v1.sketch.postTrim({ id: skId })
  console.log('[06c] postTrim maxLevel', rPost.maxLevel, 'err', JSON.stringify(firstError(rPost)))
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[06c] FINAL geo:', JSON.stringify({ lines: geo.lines, arcs: geo.arcs, circles: geo.circles, points: geo.points }))
  filewrite({ keep, trim, trimMax: rTrim.maxLevel, postMax: rPost.maxLevel, geo }, '06c')
  return { geo }
}
