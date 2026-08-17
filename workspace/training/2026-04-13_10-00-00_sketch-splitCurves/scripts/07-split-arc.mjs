// Test: Split an arc at a specific position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitArc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [0, 0, 0],
    startPos: [30, 0, 0],
    endPos: [0, 30, 0]
  })).result
  console.log('[07] arcId:', arcId)

  // Split arc at midpoint
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: arcId, values: [0.5] }]
  })

  console.log('[07] result:', JSON.stringify(r.result))
  console.log('[07] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'arc-split-response')

  await snapshot('arc-split')
  return { partId }
}
