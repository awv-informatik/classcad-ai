// Test: How do points appear in the structure tree? The protocol session noted
// {x,y,z} in members. Are they always objects? Compare with API param format [x,y,z].
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'PtStruct' }] })).result

  // Get structure and look at point members
  const r = await execute({ 'v1.common.getAppVersion': [{}] })
  const tree = r.structure?.tree
  if (!tree) {
    console.log('[struct] No structure tree available')
    return {}
  }

  // Find work geometry with point members
  for (const [id, node] of Object.entries(tree)) {
    if (node.members) {
      for (const [mName, mVal] of Object.entries(node.members)) {
        if (mVal && mVal.type === 'point') {
          console.log(`[struct-pt] ${node.name}.${mName}: value=${JSON.stringify(mVal.value)} type=${typeof mVal.value} isArray=${Array.isArray(mVal.value)}`)
        }
      }
    }
  }

  return {}
}
