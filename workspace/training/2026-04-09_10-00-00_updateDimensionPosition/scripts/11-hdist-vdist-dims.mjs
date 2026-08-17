// Test updateDimensionPosition on HORIZONTAL_DISTANCE and VERTICAL_DISTANCE dimensions
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create HORIZONTAL_DISTANCE on first line
  const hDimR = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[0]] })
  const hDimId = hDimR.result
  console.log('[11] hDimId:', hDimId, 'maxLevel:', hDimR.maxLevel)

  // Create VERTICAL_DISTANCE on second line (vertical side)
  const vDimR = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rectIds[1]] })
  const vDimId = vDimR.result
  console.log('[11] vDimId:', vDimId, 'maxLevel:', vDimR.maxLevel)

  // Update positions
  const r1 = await api.v1.sketch.updateDimensionPosition({ id: hDimId, pos: [40, -15, 0] })
  const n1 = r1.structure.tree[String(hDimId)]
  console.log('[11] hDist → result:', r1.result, 'maxLevel:', r1.maxLevel, 'dimPt:', JSON.stringify(n1?.members?.dimPt?.value))

  const r2 = await api.v1.sketch.updateDimensionPosition({ id: vDimId, pos: [95, 25, 0] })
  const n2 = r2.structure.tree[String(vDimId)]
  console.log('[11] vDist → result:', r2.result, 'maxLevel:', r2.maxLevel, 'dimPt:', JSON.stringify(n2?.members?.dimPt?.value))

  filewrite({
    hDist: { dimPt: n1?.members?.dimPt, maxLevel: r1.maxLevel },
    vDist: { dimPt: n2?.members?.dimPt, maxLevel: r2.maxLevel },
  }, 'hdist-vdist')

  return {}
}
