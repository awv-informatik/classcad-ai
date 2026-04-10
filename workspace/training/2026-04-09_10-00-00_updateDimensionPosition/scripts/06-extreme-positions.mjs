// Test updateDimensionPosition with extreme/unusual positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result

  // Origin position [0,0,0]
  const r1 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [0, 0, 0] })
  const n1 = r1.structure.tree[String(dimId)]
  console.log('[06] [0,0,0] → result:', r1.result, 'maxLevel:', r1.maxLevel, 'dimPt:', JSON.stringify(n1?.members?.dimPt?.value))

  // Very large position
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [99999, 99999, 0] })
  const n2 = r2.structure.tree[String(dimId)]
  console.log('[06] [99999,99999,0] → result:', r2.result, 'maxLevel:', r2.maxLevel, 'dimPt:', JSON.stringify(n2?.members?.dimPt?.value))

  // Negative position
  const r3 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [-100, -200, 0] })
  const n3 = r3.structure.tree[String(dimId)]
  console.log('[06] [-100,-200,0] → result:', r3.result, 'maxLevel:', r3.maxLevel, 'dimPt:', JSON.stringify(n3?.members?.dimPt?.value))

  // Non-zero Z (sketch is on XY plane)
  const r4 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [40, 25, 50] })
  const n4 = r4.structure.tree[String(dimId)]
  console.log('[06] [40,25,50] Z≠0 → result:', r4.result, 'maxLevel:', r4.maxLevel, 'dimPt:', JSON.stringify(n4?.members?.dimPt?.value))

  filewrite({
    origin: { result: r1.result, maxLevel: r1.maxLevel, dimPt: n1?.members?.dimPt?.value },
    large: { result: r2.result, maxLevel: r2.maxLevel, dimPt: n2?.members?.dimPt?.value },
    negative: { result: r3.result, maxLevel: r3.maxLevel, dimPt: n3?.members?.dimPt?.value },
    nonZeroZ: { result: r4.result, maxLevel: r4.maxLevel, dimPt: n4?.members?.dimPt?.value },
  }, 'extreme-positions')

  return {}
}
