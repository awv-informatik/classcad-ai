// Verify that dimPt expression is set to the literal position string after updateDimensionPosition
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create two dimensions of different types
  const offDimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 15 })).result
  const radDimId = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })).result

  // Get initial dimPt expressions
  const initR = await api.v1.sketch.updateDimensionPosition({ id: offDimId, pos: [40, 25, 0] })
  const offBefore = initR.structure.tree[String(offDimId)]?.members?.dimPt
  console.log('[15] OFFSET initial dimPt expression:', offBefore?.expression, 'value:', JSON.stringify(offBefore?.value))

  // Update offset dim position
  const r1 = await api.v1.sketch.updateDimensionPosition({ id: offDimId, pos: [123, 456, 0] })
  const offAfter = r1.structure.tree[String(offDimId)]?.members?.dimPt
  console.log('[15] OFFSET after dimPt expression:', offAfter?.expression, 'value:', JSON.stringify(offAfter?.value))

  // Update radius dim position
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: radDimId, pos: [77, 88, 0] })
  const radAfter = r2.structure.tree[String(radDimId)]?.members?.dimPt
  console.log('[15] RADIUS after dimPt expression:', radAfter?.expression, 'value:', JSON.stringify(radAfter?.value))

  filewrite({
    offset: { before: offBefore, after: offAfter },
    radius: { after: radAfter },
  }, 'expression-patterns')

  return {}
}
