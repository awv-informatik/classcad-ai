// 16 — Verify stored value by reading back with getExpression
// The dimension's paramName becomes an expression parameter
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result
  const dimR = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2], name: 'myDim' })
  const dimId = dimR.result
  console.log('[16] dimId:', dimId)

  // Find the dimension in the structure tree from creation response
  function findDimNode(tree) {
    if (!tree) return null
    if (tree.class && tree.class.includes('Dimension')) return tree
    if (tree.children) {
      for (const c of tree.children) {
        const found = findDimNode(c)
        if (found) return found
      }
    }
    return null
  }

  const dimNode = findDimNode(dimR.structure)
  if (dimNode) {
    console.log('[16] dim node class:', dimNode.class)
    console.log('[16] dim node paramName:', dimNode.members?.paramName)
    filewrite(dimNode, 'dim-node-creation')
  } else {
    console.log('[16] no Dimension node in creation structure')
    // Dump a subset of structure
    function collectClasses(tree, acc = []) {
      if (!tree) return acc
      if (tree.class) acc.push({ id: tree.id, class: tree.class, name: tree.name })
      if (tree.children) for (const c of tree.children) collectClasses(c, acc)
      return acc
    }
    const classes = collectClasses(dimR.structure)
    filewrite(classes, 'structure-classes')
  }

  // Try common paramName patterns
  const tryNames = ['myDim', 'Sketch.myDim', 'Dim1', 'distance1']
  for (const name of tryNames) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[16] getExpression('${name}'):`, JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  }

  // Now update to 75
  await api.v1.sketch.updateDimension({ id: dimId, value: 75 })

  // Try reading again
  for (const name of tryNames) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[16] after update getExpression('${name}'):`, JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  }

  return { partId }
}
