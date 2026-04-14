// Test: error cases — wrong geomIds, wrong types, missing params
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 20 })).result

  const results = {}

  // 1. RADIUS on a line (wrong geometry type)
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [l1] })
  results.radiusOnLine = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }
  console.log('[14] RADIUS on line:', r1.result, 'maxLevel:', r1.maxLevel)

  // 2. OFFSET on a circle (wrong geometry type)
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [c1] })
  results.offsetOnCircle = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  console.log('[14] OFFSET on circle:', r2.result, 'maxLevel:', r2.maxLevel)

  // 3. Invalid type
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'INVALID_TYPE', geomIds: [l1] })
  results.invalidType = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  console.log('[14] INVALID_TYPE:', r3.result, 'maxLevel:', r3.maxLevel)

  // 4. Missing geomIds
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET' })
  results.missingGeomIds = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  console.log('[14] missing geomIds:', r4.result, 'maxLevel:', r4.maxLevel)

  // 5. Missing type
  const r5 = await api.v1.sketch.dimension({ id: skId, geomIds: [l1] })
  results.missingType = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }
  console.log('[14] missing type:', r5.result, 'maxLevel:', r5.maxLevel)

  // 6. ANGLE on a single line (needs 2 lines)
  const r6 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [l1] })
  results.angleSingleLine = { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages }
  console.log('[14] ANGLE 1 line:', r6.result, 'maxLevel:', r6.maxLevel)

  // 7. Negative value for OFFSET
  const r7 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1], value: -20 })
  results.negativeValue = { result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages }
  console.log('[14] negative value:', r7.result, 'maxLevel:', r7.maxLevel)

  filewrite(results, 'error-cases')

  return { partId }
}
