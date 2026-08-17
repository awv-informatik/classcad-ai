export default async function (api, { filewrite }) {
  // Create with ident
  const r1 = await api.v1.assembly.create({ name: 'WithIdent', ident: 'ASM-008' })
  console.log('[08] with ident — result:', r1.result)
  const root1 = r1.structure.tree[r1.result]
  console.log('[08] with ident — children:', JSON.stringify(root1.children))

  // Inspect ALL children of the root
  for (const childId of root1.children) {
    const node = r1.structure.tree[childId]
    console.log('[08] child', childId, '— name:', node?.name, 'class:', node?.class)
    if (node?.members) {
      for (const [key, val] of Object.entries(node.members)) {
        if (val.value === 'ASM-008' || String(val.value).includes('ASM')) {
          console.log('[08]   MATCH — key:', key, 'value:', val.value)
        }
      }
    }
  }

  // Dump full structure for the extra child
  const extraChildId = root1.children[root1.children.length - 1]
  const extraChild = r1.structure.tree[extraChildId]
  filewrite(extraChild, 'extra-child')

  // Also dump nodes 4 and 6 (AllObjects children before the root)
  const allObj = r1.structure.tree[1]
  console.log('[08] AllObjects children:', JSON.stringify(allObj.children))
  for (const id of allObj.children) {
    const n = r1.structure.tree[id]
    if (n) console.log('[08] node', id, '— name:', n.name, 'class:', n.class)
  }

  filewrite(r1.structure, 'full-structure-with-ident')
  return { asmId: r1.result }
}
