export default async function (api, { filewrite }) {
  // Create WITHOUT ident for comparison
  const r = await api.v1.assembly.create({ name: 'NoIdent' })
  console.log('[09] no ident — result:', r.result)
  const root = r.structure.tree[r.result]
  console.log('[09] no ident — children:', JSON.stringify(root.children))

  for (const childId of root.children) {
    const node = r.structure.tree[childId]
    console.log('[09] child', childId, '— name:', node?.name, 'class:', node?.class)
  }

  filewrite(r.structure, 'full-structure-no-ident')
  return { asmId: r.result }
}
