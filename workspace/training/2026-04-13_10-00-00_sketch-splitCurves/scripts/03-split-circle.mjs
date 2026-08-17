// Test: Split a circle at specific parameter positions
// Docs say values are in [0,1] range, with 0→2*PI mapping for circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitCircle' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  console.log('[03] circleId:', circleId)

  // Split circle at 0.25 and 0.75 (quarter and three-quarter positions)
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: circleId, values: [0.25, 0.75] }]
  })

  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] inner length:', r.result ? r.result[0]?.length : 'null')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'circle-split-response')

  await snapshot('circle-split')
  return { partId }
}
