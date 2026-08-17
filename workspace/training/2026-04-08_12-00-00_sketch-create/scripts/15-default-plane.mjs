// Test: what default plane does sketch.create use? Inspect the work plane created.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const skR = await api.v1.sketch.create({ id: partId, name: 'DefaultPlane' })
  const skId = skR.result
  console.log('[15] sketchId:', skId)

  // Look at the sketch in the structure tree to find its work plane
  const tree = skR.structure.tree
  const skNode = tree[skId]
  console.log('[15] sketch node class:', skNode?.class)
  console.log('[15] sketch node members keys:', skNode?.members ? Object.keys(skNode.members) : 'none')

  // Find children of sketch
  if (skNode?.children) {
    console.log('[15] sketch children:', skNode.children)
    skNode.children.forEach(childId => {
      const child = tree[childId]
      console.log('[15]   child', childId, 'class:', child?.class, 'name:', child?.name)
      if (child?.members) {
        // Look for plane-related members
        for (const [key, val] of Object.entries(child.members)) {
          if (key.toLowerCase().includes('plane') || key.toLowerCase().includes('normal') || key.toLowerCase().includes('origin')) {
            console.log('[15]     member:', key, '=', JSON.stringify(val.value))
          }
        }
      }
    })
  }

  // Also check coordinate system
  if (skNode?.coordinateSystem) {
    console.log('[15] sketch coordinateSystem:', JSON.stringify(skNode.coordinateSystem))
  }

  filewrite(skNode, 'sketch-node')

  return { partId, skId }
}
