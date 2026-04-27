export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({ name: 'IdentTest', ident: 'ASM-001' })
  console.log('[03] create result:', r.result, 'maxLevel:', r.maxLevel)

  const tree = r.structure.tree
  const root = tree[r.result]
  console.log('[03] root name:', root.name)
  console.log('[03] root class:', root.class)
  console.log('[03] root members keys:', Object.keys(root.members || {}))

  // Look for ident in the structure
  const allKeys = Object.keys(root.members || {})
  for (const key of allKeys) {
    const val = root.members[key].value
    if (val === 'ASM-001' || key.toLowerCase().includes('ident')) {
      console.log('[03] FOUND ident — key:', key, 'value:', val)
    }
  }

  filewrite({ result: r.result, rootNode: root }, 'ident-create')
  return { asmId: r.result }
}
