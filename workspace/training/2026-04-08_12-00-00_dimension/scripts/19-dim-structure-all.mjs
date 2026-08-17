// Dump complete structure after creating multiple dimensions to see their tree representation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [120, 30, 0], radius: 20 })).result

  // Create several dimensions of different types
  const d1 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]], name: 'myWidth' })).result
  const d2 = (await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rectIds[1]], name: 'myHeight' })).result
  const d3 = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId], name: 'myRadius' })).result

  console.log('[19] dim IDs:', d1, d2, d3)

  // Get a fresh structure after all dims exist (use a trivial API call to get it)
  const r = await api.v1.common.getAppVersion({})

  // Extract dim nodes from structure
  const dims = {}
  for (const id of [d1, d2, d3]) {
    const node = r.structure?.tree?.[id]
    if (node) {
      dims[id] = { name: node.name, class: node.class, members: node.members }
    } else {
      dims[id] = 'NOT FOUND'
    }
  }
  console.log('[19] dim nodes found:', Object.keys(dims).length)

  filewrite(dims, 'dim-nodes')

  await snapshot('all-dims')
  return { partId, skId }
}
