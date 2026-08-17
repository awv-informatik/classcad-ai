export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({})
  const tree = r.structure.tree
  const allObj = tree[1]

  console.log('[11] AllObjects children:', JSON.stringify(allObj.children))

  for (const id of allObj.children) {
    const node = tree[id]
    console.log('[11] node', id, '— name:', node?.name, 'class:', node?.class, 'flags:', node?.flags)
  }

  // Dump the full nodes 4 and 6 which we haven't identified yet
  for (const id of [4, 6]) {
    const node = tree[id]
    if (node) filewrite(node, `node-${id}`)
  }

  // Also check currentProduct and currentInstance
  console.log('[11] root:', r.structure.root)
  console.log('[11] currentProduct:', r.structure.currentProduct)
  console.log('[11] currentInstance:', r.structure.currentInstance)

  return { asmId: r.result }
}
