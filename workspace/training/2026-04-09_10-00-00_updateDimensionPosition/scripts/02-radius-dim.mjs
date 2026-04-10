// Test updateDimensionPosition on a RADIUS dimension
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle using the sketch API (center, radius params)
  const circR = await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 25 })
  console.log('[02] circle result:', circR.result, 'maxLevel:', circR.maxLevel, 'msgs:', JSON.stringify(circR.messages))
  const circId = circR.result
  if (!circId) {
    console.log('[02] FAILED to create circle, aborting')
    return {}
  }

  // Create RADIUS dimension on circle
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })
  const dimId = dimR.result
  console.log('[02] dimId:', dimId, 'maxLevel:', dimR.maxLevel)

  // Extract dimPt before
  const bNode = dimR.structure.tree[String(dimId)]
  console.log('[02] BEFORE class:', bNode?.class)
  console.log('[02] BEFORE dimPt:', JSON.stringify(bNode?.members?.dimPt?.value))

  // Update position
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: dimId, pos: [70, 50, 0] })
  console.log('[02] result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Extract dimPt after
  const aNode = r2.structure.tree[String(dimId)]
  console.log('[02] AFTER dimPt:', JSON.stringify(aNode?.members?.dimPt?.value))
  console.log('[02] AFTER dimPt expression:', aNode?.members?.dimPt?.expression)

  filewrite({ before: bNode?.members?.dimPt, after: aNode?.members?.dimPt }, 'radius-dimPt-comparison')

  await snapshot('radius-after')
  return { partId, dimId }
}
