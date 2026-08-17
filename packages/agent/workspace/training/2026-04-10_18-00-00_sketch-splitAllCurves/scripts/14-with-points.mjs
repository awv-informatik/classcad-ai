// 14 — Sketch with points and curves. Are points included in the result?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitPoints' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const pt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  console.log('[14] point:', pt, 'l1:', l1, 'l2:', l2)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[14] result:', JSON.stringify(r.result))
  console.log('[14] maxLevel:', r.maxLevel)
  console.log('[14] result length:', r.result?.length)
  console.log('[14] point in result?', r.result?.includes(pt))

  filewrite({ result: r.result, maxLevel: r.maxLevel, pointId: pt, l1, l2 }, 'points-response')
  return { partId }
}
