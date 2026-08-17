export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RealisticPart' })).result

  // Create box base
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Base',
    length: 100,
    width: 80,
    height: 30,
  })).result

  // Add a cylindrical protrusion via sketch + extrusion
  const skId = (await api.v1.part.sketch({ id: partId, name: 'CircleSketch' })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 40, 0], radius: 20 })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circId] })).result

  const extId = (await api.v1.part.extrusion({
    id: partId,
    name: 'CylinderProtrusion',
    references: [regionId],
    type: 'UP',
    limit2: 50,
  })).result

  await api.v1.common.recalc({})

  // Find top edges of the box for chamfering
  const topEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [50, 0, 30] },   // top-front of box base
      { pos: [100, 40, 30] }, // top-right of box base
      { pos: [50, 80, 30] },  // top-back of box base
      { pos: [0, 40, 30] },   // top-left of box base
    ],
  })).result.lines
  console.log('[16] top edges:', JSON.stringify(topEdges))

  // Chamfer all top edges of the base
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    name: 'BaseChamfer',
    references: topEdges,
    type: 'EQUAL_DISTANCE',
    distance1: 8,
  })).result
  console.log('[16] chamfer result:', chamferId)

  await snapshot('result')

  filewrite({ boxId, extId, chamferId, topEdges }, 'ids')

  return { partId }
}
