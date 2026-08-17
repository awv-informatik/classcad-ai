// 09 — Cross-sketch rigid set: verify structure placement
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossSketchStruct' })).result
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const sk2 = (await api.v1.sketch.create({ id: partId })).result

  const lineInSk1 = (await api.v1.sketch.line({ id: sk1, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  console.log('[09] sk1:', sk1, 'sk2:', sk2, 'line:', lineInSk1)

  const rs = await api.v1.sketch.rigidSet({ id: sk2, geomIds: [lineInSk1] })
  console.log('[09] rigidSet:', rs.result)

  // Dump structure to see where the rigid set ended up
  filewrite(rs.structure, 'structure')

  // Check: is rigid set child of sk2?
  const tree = rs.structure.tree
  const rsNode = tree[String(rs.result)]
  console.log('[09] rigidSet parent:', rsNode.parent)
  console.log('[09] rigidSet entities:', JSON.stringify(rsNode.members.entities))

  // Check sk1 and sk2 children
  const sk1Node = tree[String(sk1)]
  const sk2Node = tree[String(sk2)]
  console.log('[09] sk1 children:', sk1Node.children)
  console.log('[09] sk2 children:', sk2Node.children)

  return { partId }
}
