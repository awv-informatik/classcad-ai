export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllTypes' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })

  // Create all 9 view types in one call
  const allTypes = ['TOP', 'FRONT', 'RIGHT', 'LEFT', 'BOTTOM', 'RIGHT_90', 'LEFT_90', 'BACK', 'ISO']
  const r = await api.v1.drawing2d.view({ id: partId, types: allTypes })
  console.log('[02] all types result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)
  console.log('[02] types count:', allTypes.length, 'result count:', r.result.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'all-types-response')

  // Map returned IDs to type names by examining the structure tree
  const tree = r.structure.tree
  const viewNodes = []
  for (const [nid, node] of Object.entries(tree)) {
    if (node.class === 'CC_View2D') {
      viewNodes.push({ id: parseInt(nid), name: node.name, parent: node.parent })
    }
  }
  console.log('[02] CC_View2D nodes:', JSON.stringify(viewNodes))
  filewrite(viewNodes, 'view-nodes')

  // Check order: result vs types
  console.log('[02] input types:', JSON.stringify(allTypes))
  console.log('[02] result IDs:', JSON.stringify(r.result))

  // Find the ViewSet
  for (const [nid, node] of Object.entries(tree)) {
    if (node.class === 'CC_ViewSet') {
      console.log('[02] ViewSet id:', nid, 'children:', JSON.stringify(node.children))
    }
  }

  await snapshot('all-views')
  return { partId }
}
