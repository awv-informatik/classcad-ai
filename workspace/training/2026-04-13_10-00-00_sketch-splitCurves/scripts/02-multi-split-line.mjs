// Test: Split a line at multiple positions (3 splits → 4 segments)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiSplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[02] lineId:', lineId)

  // Split at 0.25, 0.5, 0.75 → expect 4 segments
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.25, 0.5, 0.75] }]
  })

  console.log('[02] result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] result length:', r.result ? r.result.length : 'null')
  console.log('[02] inner length:', r.result ? r.result[0]?.length : 'null')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-split-response')

  await snapshot('multi-split')
  return { partId }
}
