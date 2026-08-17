export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTest2' })).result
  console.log('[02] partId:', partId)

  // Get default Top plane
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  console.log('[02] topPlaneId:', topId)

  // Create sketch WITH planeId
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  console.log('[02] sketchId:', skId)

  // Rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[02] rectIds:', rectIds)

  // Region
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  console.log('[02] regionId:', regionId)

  // Extrusion with region reference
  const r1 = await api.v1.part.extrusion({
    id: partId,
    name: 'ExtRegion',
    references: [regionId],
    type: 'UP',
    limit2: 60,
  })
  console.log('[02] extrusion (region) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'region-extrusion')

  await snapshot('region-extrusion')

  // Also test: pass line IDs instead of region ID as references
  const skId2 = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds2 = (await api.v1.sketch.rectangle({ id: skId2, startPos: [100, 0, 0], endPos: [150, 30, 0] })).result
  console.log('[02] rectIds2:', rectIds2)

  const r2 = await api.v1.part.extrusion({
    id: partId,
    name: 'ExtLines',
    references: rectIds2,
    type: 'UP',
    limit2: 40,
  })
  console.log('[02] extrusion (lines) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'lines-extrusion')

  await snapshot('both-extrusions')
  return { partId }
}
