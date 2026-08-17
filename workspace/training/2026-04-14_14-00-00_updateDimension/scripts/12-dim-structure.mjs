// Dump the dimension structure tree to find the correct member names
// This tells us what linkWithExpression can target
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimStruct' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  // Create an expression
  await api.v1.part.expression({ id: partId, name: 'myLen', value: 150 })

  // OFFSET dimension
  const dimR = await api.v1.sketch.dimension({ id: skId, name: 'len', type: 'OFFSET', geomIds: [lineId] })
  const dimId = dimR.result

  // Get dimension node from structure
  const dimNode = dimR.structure.tree[dimId]
  console.log('[12] dim class:', dimNode?.class)
  console.log('[12] dim members keys:', Object.keys(dimNode?.members || {}))

  // Dump full dimension node
  filewrite(dimNode, 'dim-node')

  // Try linkWithExpression with various member names
  const memberNames = Object.keys(dimNode?.members || {})
  const linkResults = {}
  for (const name of memberNames) {
    const lr = await api.v1.part.linkWithExpression({ id: dimId, exprName: 'myLen', name })
    linkResults[name] = { result: lr.result, maxLevel: lr.maxLevel, messages: lr.messages?.map(m => m.message) }
    console.log('[12] link name="' + name + '":', lr.result, lr.maxLevel, lr.messages?.map(m => m.message).join('; '))
  }

  filewrite(linkResults, 'link-results')

  // Check if any worked
  const p = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[12] endX after link attempts:', p.endPos.x)

  return { partId }
}
