// Dump structure tree for a sketch with dimensions to understand data format
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Simple geometry: a line, a circle
  const line = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  const circle = await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 10 })
  const line2 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 40, 0] })

  // Get point IDs
  const l1pts = (await api.v1.sketch.getPoints({ id: line.result })).result
  const l2pts = (await api.v1.sketch.getPoints({ id: line2.result })).result

  // Add dimensions of different types
  const dOff = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line.result] })
  const dRad = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circle.result] })
  const dHD = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [l1pts.startId, l1pts.endId] })
  const dVD = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [l2pts.startId, l2pts.endId] })
  const dDia = await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circle.result] })

  console.log('[08] dims:', { dOff: dOff.result, dRad: dRad.result, dHD: dHD.result, dVD: dVD.result, dDia: dDia.result })

  // Dump relevant parts of structure tree
  const tree = dOff.structure?.tree || {}
  const dimNodes = {}
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.class?.includes('Dimension')) {
      dimNodes[id] = obj
    }
  }
  filewrite(dimNodes, 'dim-nodes')

  // Also dump the sketch node to see parent-child relationships
  const sketchNode = tree[String(skId)]
  filewrite(sketchNode, 'sketch-node')

  // Dump a few IDs around the dimensions to see hierarchy
  const contextIds = [dOff.result, dRad.result, dHD.result, dVD.result, dDia.result]
  const context = {}
  for (const did of contextIds) {
    if (did != null) {
      context[did] = tree[String(did)]
      // Check parent
      const parentId = tree[String(did)]?.parentId
      if (parentId != null) context[`parent-${did}`] = { parentId, parentClass: tree[String(parentId)]?.class }
    }
  }
  filewrite(context, 'dim-context')

  return { partId }
}
