export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolClass' })).result

  // Create two boxes for a boolean
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (
    await api.v1.part.box({ id: partId, name: 'Box2', length: 40, width: 60, height: 20, translation: [10, -10, 5] })
  ).result

  // Create a boolean union
  const boolId = (
    await api.v1.part.boolean({ id: partId, name: 'BoolUnion', type: 'UNION', target: box1, tools: [box2] })
  ).result
  console.log('[06] boolId:', boolId)

  // Dump the structure to find the boolean's class name
  const r = await api.v1.common.recalc({})
  filewrite(r.structure, 'bool-structure')

  // Extract the boolean node's class
  const tree = r.structure.tree
  if (tree[boolId]) {
    const node = tree[boolId]
    console.log('[06] boolean class:', node.class, 'name:', node.name)
    filewrite(node, 'bool-node')
  }

  // Also try CC_BooleanOperation, CC_BoolOp, etc.
  const guesses = ['CC_BooleanOperation', 'CC_BoolOp', 'CC_Union', 'CC_Subtraction', 'CC_Intersection']
  for (const g of guesses) {
    const r2 = await api.v1.part.createUncommitedObject({ id: partId, type: g, name: 'Test_' + g })
    console.log(`[06] ${g}: result=${r2.result} maxLevel=${r2.maxLevel} msg=${r2.messages?.[0]?.message || 'none'}`)
    if (r2.result) {
      // Commit it
      await api.v1.part.openFeature({ id: r2.result })
      await api.v1.part.closeFeature({ id: r2.result })
    }
  }

  return { partId, boolId }
}
