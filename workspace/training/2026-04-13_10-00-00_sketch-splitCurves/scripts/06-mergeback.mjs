// Test: splitCurves + splitCurvesMergeBack workflow
// Does mergeBack work the same way as with splitAllCurves?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeBack' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[06] lineId:', lineId)

  // Split at midpoint
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.5] }]
  })
  console.log('[06] splitCurves result:', JSON.stringify(r.result))

  // Now merge back — this should consolidate the split segments
  const mr = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[06] mergeBack result:', JSON.stringify(mr.result))
  console.log('[06] mergeBack maxLevel:', mr.maxLevel)
  filewrite({ result: mr.result, messages: mr.messages, maxLevel: mr.maxLevel }, 'mergeback-response')
  filewrite(mr.structure, 'structure-after-mergeback')

  await snapshot('after-mergeback')

  return { partId }
}
