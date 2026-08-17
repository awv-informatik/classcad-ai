export default async function (api, { filewrite }) {
  const r = await api.v1.assembly.create({})
  const tree = r.structure.tree
  const allObj = tree[1]

  // Nodes 4 and 6 are children of AllObjects but not in the structure tree
  // Try to get info via setObjectName or getUserDataKeys
  for (const id of [4, 6]) {
    console.log('[19] node', id, 'in tree:', tree[id] !== undefined)

    // Try to get name info
    try {
      const keys = await api.v1.common.getUserDataKeys({ id })
      console.log('[19] node', id, 'userData keys:', JSON.stringify(keys.result), 'maxLevel:', keys.maxLevel)
    } catch (e) {
      console.log('[19] node', id, 'getUserDataKeys error:', e.message)
    }
  }

  filewrite({ allObjectsChildren: allObj.children, treeKeys: Object.keys(tree) }, 'hidden-nodes')
  return { asmId: r.result }
}
