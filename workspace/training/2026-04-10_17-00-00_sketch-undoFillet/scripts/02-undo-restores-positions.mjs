// Test: Does undoFillet restore the exact point positions?
// Use getPositions to compare before/after coordinates.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoPositions' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Get positions BEFORE fillet
  const posBefore = await api.v1.sketch.getPositions({ id: skId })
  filewrite(posBefore.result, 'positions-before')

  // Also get points
  const ptsBefore = await api.v1.sketch.getPoints({ id: skId })
  filewrite(ptsBefore.result, 'points-before')

  // Fillet one corner
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 15 })
  const [arcId] = f.result

  // Get positions AFTER fillet
  const posAfterFillet = await api.v1.sketch.getPositions({ id: skId })
  filewrite(posAfterFillet.result, 'positions-after-fillet')
  const ptsAfterFillet = await api.v1.sketch.getPoints({ id: skId })
  filewrite(ptsAfterFillet.result, 'points-after-fillet')

  // Undo
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[02] undo result:', u.result, 'maxLevel:', u.maxLevel)

  // Get positions AFTER undo
  const posAfterUndo = await api.v1.sketch.getPositions({ id: skId })
  filewrite(posAfterUndo.result, 'positions-after-undo')
  const ptsAfterUndo = await api.v1.sketch.getPoints({ id: skId })
  filewrite(ptsAfterUndo.result, 'points-after-undo')

  // Check if before == after undo
  const beforeStr = JSON.stringify(posBefore.result)
  const afterStr = JSON.stringify(posAfterUndo.result)
  console.log('[02] positions match before/after undo:', beforeStr === afterStr)
  console.log('[02] point count before:', Object.keys(ptsBefore.result || {}).length,
    'after fillet:', Object.keys(ptsAfterFillet.result || {}).length,
    'after undo:', Object.keys(ptsAfterUndo.result || {}).length)

  return { partId }
}
