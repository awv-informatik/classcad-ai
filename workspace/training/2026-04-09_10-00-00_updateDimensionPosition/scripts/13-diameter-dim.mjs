// Test updateDimensionPosition on a DIAMETER dimension
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 25 })).result
  console.log('[13] circId:', circId)

  // Create DIAMETER dimension
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circId] })
  const dimId = dimR.result
  console.log('[13] dimId:', dimId, 'maxLevel:', dimR.maxLevel)

  const bNode = dimR.structure.tree[String(dimId)]
  console.log('[13] BEFORE class:', bNode?.class, 'dimPt:', JSON.stringify(bNode?.members?.dimPt?.value))

  // Update position
  const r = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [65, 55, 0] })
  const aNode = r.structure.tree[String(dimId)]
  console.log('[13] AFTER dimPt:', JSON.stringify(aNode?.members?.dimPt?.value), 'maxLevel:', r.maxLevel)

  filewrite({ before: bNode?.members?.dimPt, after: aNode?.members?.dimPt, className: bNode?.class }, 'diameter-result')

  return {}
}
