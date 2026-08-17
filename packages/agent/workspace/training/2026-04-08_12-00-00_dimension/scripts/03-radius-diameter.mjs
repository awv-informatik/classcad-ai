// Test RADIUS and DIAMETER dimension types on circles and arcs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 20 })).result
  console.log('[03] circle ID:', circId)

  // Create an arc
  const arcId = (await api.v1.sketch.arcByCenter({ id: skId, centerPos: [100, 30, 0], startPos: [120, 30, 0], endPos: [100, 50, 0] })).result
  console.log('[03] arc ID:', arcId)

  // RADIUS on circle
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })
  console.log('[03] RADIUS circle result:', r1.result, 'maxLevel:', r1.maxLevel)

  // DIAMETER on circle
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circId] })
  console.log('[03] DIAMETER circle result:', r2.result, 'maxLevel:', r2.maxLevel)

  // RADIUS on arc
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [arcId] })
  console.log('[03] RADIUS arc result:', r3.result, 'maxLevel:', r3.maxLevel)

  // DIAMETER on arc
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [arcId] })
  console.log('[03] DIAMETER arc result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    radiusCircle: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    diameterCircle: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    radiusArc: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    diameterArc: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'radius-diameter-responses')

  await snapshot('radius-diameter')
  return { partId, skId }
}
