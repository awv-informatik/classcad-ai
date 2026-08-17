export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({ name: 'IdentCheck', ident: 'ASM-007' })
  const asmId = r.result
  console.log('[07] create result:', asmId, 'maxLevel:', r.maxLevel)

  // Check if ident is stored as userData
  const keys = await api.v1.common.getUserDataKeys({ id: asmId })
  console.log('[07] userData keys:', JSON.stringify(keys.result))

  if (keys.result && keys.result.length > 0) {
    for (const key of keys.result) {
      const val = await api.v1.common.getUserData({ id: asmId, key })
      console.log('[07] userData[' + key + ']:', val.result)
    }
  }

  // Also check the full structure for the root node
  const tree = r.structure.tree
  const root = tree[asmId]

  // Check instances/instancesNested arrays
  console.log('[07] instances:', JSON.stringify(root.instances))
  console.log('[07] instancesNested:', JSON.stringify(root.instancesNested))
  console.log('[07] children:', JSON.stringify(root.children))

  filewrite({ asmId, root, userDataKeys: keys.result }, 'ident-check')
  return { asmId }
}
