// Test error cases: wrong geomIds count, invalid type, wrong geometry type
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [120, 30, 0], radius: 15 })).result

  // Error: RADIUS on a line (not a circle/arc)
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [rectIds[0]] })
  console.log('[12] RADIUS on line result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] RADIUS on line messages:', JSON.stringify(r1.messages))

  // Error: ANGLE with only 1 geomId (needs 2)
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [rectIds[0]] })
  console.log('[12] ANGLE 1-geomId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] ANGLE 1-geomId messages:', JSON.stringify(r2.messages))

  // Error: OFFSET on a circle
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [circId] })
  console.log('[12] OFFSET on circle result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[12] OFFSET on circle messages:', JSON.stringify(r3.messages))

  // Error: invalid type string
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'INVALID_TYPE', geomIds: [rectIds[0]] })
  console.log('[12] INVALID_TYPE result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[12] INVALID_TYPE messages:', JSON.stringify(r4.messages))

  // Error: empty geomIds
  const r5 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [] })
  console.log('[12] empty geomIds result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[12] empty geomIds messages:', JSON.stringify(r5.messages))

  filewrite({
    radiusOnLine: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    angle1GeomId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    offsetOnCircle: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    invalidType: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    emptyGeomIds: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-responses')

  return { partId, skId }
}
