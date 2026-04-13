// Test: 3 splits on circle — expect 3 or 4 segments?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Circle3Splits' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result

  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: circleId, values: [0.25, 0.5, 0.75] }]
  })
  console.log('[12] 3 splits on circle → segments:', r.result?.[0]?.length, 'ids:', JSON.stringify(r.result))
  filewrite({ count: r.result?.[0]?.length, ids: r.result?.[0] }, 'circle-3splits')

  return { partId }
}
