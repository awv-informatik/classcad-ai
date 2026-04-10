// 14 — Verify the stored dimension value by inspecting structure tree nodes
// Look for the dimension node and its paramName, value members
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2], name: 'widthDim' })).result
  console.log('[14] dimId:', dimId)

  // Get structure before update
  const r1 = await api.v1.sketch.updateDimension({ id: dimId, value: 40 })
  // Search for dimension node in structure
  function findNode(tree, id) {
    if (!tree) return null
    if (tree.id === id) return tree
    if (tree.children) {
      for (const c of tree.children) {
        const found = findNode(c, id)
        if (found) return found
      }
    }
    return null
  }

  const dimNode1 = findNode(r1.structure, dimId)
  if (dimNode1) {
    console.log('[14] dim node before class:', dimNode1.class)
    console.log('[14] dim node before members:', Object.keys(dimNode1.members || {}))
    filewrite(dimNode1, 'dim-node-before')
  } else {
    console.log('[14] dim node NOT FOUND in structure')
    // Try to find by looking at all nodes
    function allNodes(tree, acc = []) {
      if (!tree) return acc
      acc.push({ id: tree.id, class: tree.class, name: tree.name })
      if (tree.children) for (const c of tree.children) allNodes(c, acc)
      return acc
    }
    const nodes = allNodes(r1.structure)
    filewrite(nodes.filter(n => n.class && n.class.includes('Dimension')), 'dim-candidates')
  }

  // Update to 75 and check again
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: 75 })
  const dimNode2 = findNode(r2.structure, dimId)
  if (dimNode2) {
    filewrite(dimNode2, 'dim-node-after')
    console.log('[14] dim node after paramName:', dimNode2.members?.paramName)
  }

  return { partId }
}
