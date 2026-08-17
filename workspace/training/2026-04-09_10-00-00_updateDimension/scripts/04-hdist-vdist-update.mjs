// 04 — updateDimension on HORIZONTAL_DISTANCE and VERTICAL_DISTANCE
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two points for HORIZONTAL_DISTANCE
  const p1 = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0] })).result
  const p2 = (await api.v1.sketch.point({ id: skId, pos: [70, 20, 0] })).result

  const hdistDimId = (await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2]
  })).result
  console.log('[04] hdistDimId:', hdistDimId)

  // Update H_DIST to 100
  const r1 = await api.v1.sketch.updateDimension({ id: hdistDimId, value: 100 })
  console.log('[04] HDIST update result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'hdist-update')

  // Line for VERTICAL_DISTANCE (single line)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -10, 0], endPos: [0, -60, 0] })).result
  const vdistDimId = (await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [l1]
  })).result
  console.log('[04] vdistDimId:', vdistDimId)

  // Update V_DIST to 80
  const r2 = await api.v1.sketch.updateDimension({ id: vdistDimId, value: 80 })
  console.log('[04] VDIST update result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'vdist-update')

  await snapshot('after-updates')
  return { partId }
}
