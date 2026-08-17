// Test: OFFSET dimension on a single line — basic creation with auto-calculated value
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  console.log('[01] lineId:', l1)

  await snapshot('before')

  // Create OFFSET dimension on the line — omit value to get auto-calculated
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })
  console.log('[01] dimension result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  // Check messages
  if (dimR.messages?.length) {
    console.log('[01] messages:', JSON.stringify(dimR.messages))
  }

  // Find the dimension in the structure tree
  const dimNode = dimR.structure ? Object.values(dimR.structure.tree)
    .find(n => n.id === dimR.result) : null
  if (dimNode) {
    console.log('[01] dim class:', dimNode.class, 'name:', dimNode.name)
    filewrite(dimNode, 'offset-dim-node')
  }

  // Dump key info
  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    messages: dimR.messages,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    dimMembers: dimNode?.members
  }, 'offset-basic')

  await snapshot('after')

  return { partId, skId, dimId: dimR.result }
}
