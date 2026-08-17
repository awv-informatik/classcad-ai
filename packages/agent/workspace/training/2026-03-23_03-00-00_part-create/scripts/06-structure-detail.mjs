// Detailed structure tree inspection after part.create
export default async function (api, { filewrite }) {
  const r = await api.v1.part.create({ name: 'StructureTest' })
  const partId = r.result
  const tree = r.structure.tree

  console.log('[06] partId:', partId)
  console.log('[06] root:', r.structure.root)
  console.log('[06] currentProduct:', r.structure.currentProduct)
  console.log('[06] currentInstance:', r.structure.currentInstance)

  // Inspect each node
  for (const [id, node] of Object.entries(tree)) {
    console.log(`[06] node ${id}: class=${node.class} name=${node.name} parent=${node.parent} flags=${node.flags}`)
    if (node.children) {
      console.log(`[06]   children: ${node.children.join(', ')}`)
    }
  }

  filewrite(r.structure, 'full-structure')
  return { partId, nodeCount: Object.keys(tree).length }
}
