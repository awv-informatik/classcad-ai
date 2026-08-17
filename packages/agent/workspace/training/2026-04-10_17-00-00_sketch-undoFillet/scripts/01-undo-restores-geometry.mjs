// Test: Does undoFillet restore original line positions/lengths exactly?
// Compare getGeometry before fillet, after fillet, and after undo.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoRestore' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Get geometry BEFORE fillet
  const geoBefore = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoBefore.result, 'geo-before')
  await snapshot('before-fillet')

  // Apply fillet
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 15 })
  console.log('[01] fillet result:', JSON.stringify(f.result), 'maxLevel:', f.maxLevel)
  const [arcId] = f.result

  // Get geometry AFTER fillet
  const geoAfterFillet = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoAfterFillet.result, 'geo-after-fillet')
  await snapshot('after-fillet')

  // Undo the fillet
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[01] undoFillet result:', u.result, 'maxLevel:', u.maxLevel, 'messages:', JSON.stringify(u.messages))

  // Get geometry AFTER undo
  const geoAfterUndo = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoAfterUndo.result, 'geo-after-undo')
  await snapshot('after-undo')

  // Compare element counts
  const countBefore = Array.isArray(geoBefore.result) ? geoBefore.result.length : 0
  const countAfterFillet = Array.isArray(geoAfterFillet.result) ? geoAfterFillet.result.length : 0
  const countAfterUndo = Array.isArray(geoAfterUndo.result) ? geoAfterUndo.result.length : 0
  console.log('[01] element counts — before:', countBefore, 'after fillet:', countAfterFillet, 'after undo:', countAfterUndo)

  filewrite({ countBefore, countAfterFillet, countAfterUndo }, 'element-counts')

  return { partId }
}
