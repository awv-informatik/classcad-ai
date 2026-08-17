// Verify structure tree cleanup — all 3 internal objects removed
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Get structure before sketch creation
  const r0 = await api.v1.common.getAppVersion({})
  const structBefore = (await api.v1.sketch.create({ id: partId, name: 'TreeTest' }))
  const skId = structBefore.result
  console.log('[07] created sketch:', skId)

  // Dump structure after creation
  filewrite(structBefore.structure, 'structure-after-create')

  // Count structure nodes
  function countNodes(structure) {
    if (!structure) return 0
    let count = 0
    function walk(nodes) {
      for (const n of nodes) {
        count++
        if (n.nodes) walk(n.nodes)
      }
    }
    if (Array.isArray(structure)) walk(structure)
    return count
  }
  const nodesWithSketch = countNodes(structBefore.structure)
  console.log('[07] nodes after create:', nodesWithSketch)

  // Delete the sketch
  const delR = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[07] delete maxLevel:', delR.maxLevel)

  // Dump structure after deletion
  filewrite(delR.structure, 'structure-after-delete')
  const nodesAfterDelete = countNodes(delR.structure)
  console.log('[07] nodes after delete:', nodesAfterDelete)
  console.log('[07] nodes removed:', nodesWithSketch - nodesAfterDelete)

  return { partId }
}
