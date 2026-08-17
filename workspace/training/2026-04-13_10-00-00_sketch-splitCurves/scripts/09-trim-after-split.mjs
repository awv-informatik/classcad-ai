// Test: Can we use splitCurves result IDs with trimCurves?
// Are they interchangeable with splitAllCurves results?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimAfterSplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[09] lineId:', lineId)

  await snapshot('before')

  // Split the line into 3 segments
  const splitR = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.33, 0.66] }]
  })
  console.log('[09] split result:', JSON.stringify(splitR.result))

  const segments = splitR.result[0]
  console.log('[09] segment IDs:', segments)

  // Trim the middle segment
  const trimR = await api.v1.sketch.trimCurves({
    id: skId,
    curveIds: [segments[1]]
  })
  console.log('[09] trim result:', JSON.stringify(trimR.result), 'maxLevel:', trimR.maxLevel)
  filewrite({ result: trimR.result, messages: trimR.messages, maxLevel: trimR.maxLevel }, 'trim-response')

  // Merge back
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[09] mergeBack maxLevel:', mergeR.maxLevel)
  filewrite(mergeR.structure, 'structure-after-trim-merge')

  await snapshot('after-trim-merge')

  return { partId }
}
