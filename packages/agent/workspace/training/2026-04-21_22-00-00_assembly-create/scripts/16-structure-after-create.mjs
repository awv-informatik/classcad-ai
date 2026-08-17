export default async function (api, { filewrite }) {
  // Detailed structure inspection right after create
  const r = await api.v1.assembly.create({ name: 'StructureTest' })
  const asmId = r.result
  const tree = r.structure.tree

  // Catalog every node class and name
  const catalog = {}
  for (const [id, node] of Object.entries(tree)) {
    catalog[id] = { name: node.name, class: node.class, parent: node.parent, children: node.children }
  }
  console.log('[16] total nodes:', Object.keys(tree).length)
  filewrite(catalog, 'node-catalog')

  // Check the 3 standard children of assembly root
  const root = tree[asmId]
  for (const childId of root.children) {
    const child = tree[childId]
    if (child) {
      console.log('[16] child', childId, '— name:', child.name, 'class:', child.class)
      if (child.members) {
        const memberKeys = Object.keys(child.members)
        console.log('[16]   members:', memberKeys.join(', '))
      }
    }
  }

  return { asmId }
}
