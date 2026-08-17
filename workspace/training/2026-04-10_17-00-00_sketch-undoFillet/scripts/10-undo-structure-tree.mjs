// Test: What does the structure tree look like before/after undo?
// Dump r.structure to see what changes when a fillet is undone.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoStructure' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet one corner
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId, controlPtId, startPtId, endPtId] = f.result
  console.log('[10] fillet IDs — arc:', arcId, 'controlPt:', controlPtId, 'startPt:', startPtId, 'endPt:', endPtId)

  // Get structure after fillet (just the result portion is enough)
  const filletStructure = f.structure
  // Don't dump the whole structure tree — too large. Focus on what we need.

  // Undo
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[10] undo maxLevel:', u.maxLevel)

  // After undo, verify the fillet-created IDs no longer exist
  // Try to get geometry — the arc should be gone
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  const arcStillExists = geo.result.arcs?.includes(arcId) || false
  console.log('[10] arc still exists after undo:', arcStillExists)
  console.log('[10] arcs:', geo.result.arcs, 'lines:', geo.result.lines)

  filewrite({
    filletIds: { arcId, controlPtId, startPtId, endPtId },
    arcExistsAfterUndo: arcStillExists,
    geoAfterUndo: geo.result
  }, 'undo-structure-check')

  return { partId }
}
