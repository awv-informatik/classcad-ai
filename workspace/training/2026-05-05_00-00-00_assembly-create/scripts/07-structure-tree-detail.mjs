export default async function (api, { filewrite }) {
  // Deep dive: what does the structure tree look like after assembly.create?
  // Focus on node types, names, relationships
  const r = await api.v1.assembly.create({ name: 'StructureTest', ident: 'ST-001' })
  console.log('[07] asmId:', r.result)

  // Walk the structure tree to understand the node hierarchy
  const tree = r.structure
  if (tree && tree.length > 0) {
    // Print top-level nodes
    for (const node of tree.slice(0, 10)) {
      console.log('[07] node:', node.id, node.class, node.name || '(unnamed)')
    }
  }

  filewrite(tree, 'full-structure-tree')

  return { asmId: r.result }
}
