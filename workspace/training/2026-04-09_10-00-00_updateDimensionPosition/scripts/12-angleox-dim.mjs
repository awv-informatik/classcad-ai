// Test updateDimensionPosition on an ANGLEOX dimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line at an angle
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[12] lineId:', lineId)

  // Create ANGLEOX dimension
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [lineId] })
  const dimId = dimR.result
  console.log('[12] dimId:', dimId, 'maxLevel:', dimR.maxLevel)

  if (!dimId) {
    console.log('[12] FAILED to create ANGLEOX dim')
    return {}
  }

  const bNode = dimR.structure.tree[String(dimId)]
  console.log('[12] BEFORE class:', bNode?.class, 'dimPt:', JSON.stringify(bNode?.members?.dimPt?.value))

  // Update position
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [30, -10, 0] })
  const aNode = r.structure.tree[String(dimId)]
  console.log('[12] AFTER dimPt:', JSON.stringify(aNode?.members?.dimPt?.value), 'maxLevel:', r.maxLevel)

  filewrite({ before: bNode?.members?.dimPt, after: aNode?.members?.dimPt, className: bNode?.class }, 'angleox-result')

  return {}
}
