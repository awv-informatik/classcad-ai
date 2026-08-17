// Test updateDimensionPosition on an ANGLE dimension
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines that form an angle
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 50, 0] })).result
  console.log('[03] line1:', line1, 'line2:', line2)

  // Create ANGLE dimension
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2] })
  const dimId = dimR.result
  console.log('[03] dimId:', dimId, 'maxLevel:', dimR.maxLevel)

  // Before
  const bNode = dimR.structure.tree[String(dimId)]
  console.log('[03] BEFORE dimPt:', JSON.stringify(bNode?.members?.dimPt?.value))
  console.log('[03] class:', bNode?.class)

  // Update position
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [25, 25, 0] })
  console.log('[03] result:', r2.result, 'maxLevel:', r2.maxLevel)

  // After
  const aNode = r2.structure.tree[String(dimId)]
  console.log('[03] AFTER dimPt:', JSON.stringify(aNode?.members?.dimPt?.value))

  filewrite({ before: bNode?.members?.dimPt, after: aNode?.members?.dimPt, className: bNode?.class }, 'angle-dimPt-comparison')

  await snapshot('angle-after')
  return { partId, dimId }
}
