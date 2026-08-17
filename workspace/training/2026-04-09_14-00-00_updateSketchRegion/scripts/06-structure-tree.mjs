// Test: Verify structure tree reflects update (curves member changes)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'MyRegion' })).result

  // Get structure before update
  const structBefore = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyRegion' })

  // Walk structure tree to find region node
  function findRegion(nodes) {
    if (!nodes || !Array.isArray(nodes)) return null
    for (const node of nodes) {
      if (node.id === regionId) return node
      const found = findRegion(node.children)
      if (found) return found
    }
    return null
  }

  const regionNodeBefore = findRegion(structBefore.structure)
  console.log('[06] before curves:', regionNodeBefore?.members?.curves)
  console.log('[06] before selected:', regionNodeBefore?.members?.selected)

  // Create new geometry and update
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -20, 0], endPos: [30, -20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, -20, 0], endPos: [15, -5, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [15, -5, 0], endPos: [0, -20, 0] })).result

  await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: [l1, l2, l3] }] })

  // Get structure after
  const structAfter = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyRegion' })
  const regionNodeAfter = findRegion(structAfter.structure)
  console.log('[06] after curves:', regionNodeAfter?.members?.curves)
  console.log('[06] after selected:', regionNodeAfter?.members?.selected)

  filewrite({
    before: { curves: regionNodeBefore?.members?.curves, selected: regionNodeBefore?.members?.selected },
    after: { curves: regionNodeAfter?.members?.curves, selected: regionNodeAfter?.members?.selected },
  }, 'region-members-diff')

  return { partId }
}
