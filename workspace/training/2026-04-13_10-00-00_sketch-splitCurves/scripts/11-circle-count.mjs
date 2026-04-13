// Test: Verify circle (closed curve) segment count
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleCount' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result

  // 1 split on circle
  const r1 = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: circleId, values: [0.5] }]
  })
  console.log('[11] 1 split on circle → segments:', r1.result?.[0]?.length, 'ids:', JSON.stringify(r1.result))
  filewrite({ count: r1.result?.[0]?.length, ids: r1.result?.[0] }, 'circle-1split')

  return { partId }
}
