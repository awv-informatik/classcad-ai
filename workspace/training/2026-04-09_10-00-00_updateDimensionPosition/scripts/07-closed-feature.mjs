// Test updateDimensionPosition on a dimension in a closed feature
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  console.log('[07] dimId:', dimId)

  // Close the feature
  const closeR = await api.v1.part.closeFeature({ id: skId })
  console.log('[07] closeFeature result:', closeR.result, 'maxLevel:', closeR.maxLevel)

  // Try updateDimensionPosition on closed feature
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [50, 60, 0] })
  console.log('[07] closed feature → result:', r.result, 'maxLevel:', r.maxLevel, 'msgs:', JSON.stringify(r.messages))

  // Check dimPt after
  const node = r.structure?.tree?.[String(dimId)]
  console.log('[07] dimPt after (closed):', JSON.stringify(node?.members?.dimPt?.value))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, dimPt: node?.members?.dimPt?.value }, 'closed-feature-result')

  return {}
}
