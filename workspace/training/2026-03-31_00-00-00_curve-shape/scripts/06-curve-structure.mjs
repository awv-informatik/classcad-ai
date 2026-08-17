// 06 — Where do curves live in the structure tree? Dump the shape node after adding curves.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CurveHolder' })).result

  // Add a line and circle
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const r = await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })

  // Dump the full structure tree to find where curves live
  const tree = r.structure.tree

  // Look at the shape node
  const shapeNode = tree[String(shapeId)]
  console.log('[06] shape node keys:', Object.keys(shapeNode || {}).join(', '))
  console.log('[06] shape children:', shapeNode?.children)

  // Also look at all nodes parented to shape
  const childNodes = {}
  for (const [nid, node] of Object.entries(tree)) {
    if (node.parent === shapeId) {
      childNodes[nid] = { class: node.class, name: node.name, members: Object.keys(node.members || {}) }
    }
  }
  console.log('[06] nodes parented to shape:', JSON.stringify(childNodes))

  // Also look at geometrySet on the part
  const partNode = tree[String(partId)]
  console.log('[06] part geometrySet:', partNode?.geometrySet)

  filewrite({ shapeNode, childNodes }, 'curve-structure')
  await snapshot('curves-in-shape')

  return { shapeId }
}
