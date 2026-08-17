// Test: Basic split of a line at one position (midpoint)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitCurvesBasic' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw a horizontal line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[01] lineId:', lineId)

  await snapshot('before-split')

  // Split at midpoint (0.5)
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.5] }]
  })

  console.log('[01] splitCurves result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'split-response')

  // Check the structure after split
  filewrite(r.structure, 'structure-after-split')

  await snapshot('after-split')

  return { partId }
}
