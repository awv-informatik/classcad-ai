// Undo a fillet then re-apply it — does re-fillet work on restored lines?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoRedo' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Create fillet
  const r1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId1] = r1.result
  console.log('[15] first fillet arcId:', arcId1)

  // Undo it
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId: arcId1 })
  console.log('[15] undoFillet maxLevel:', u.maxLevel)

  // Re-apply fillet on the same lines (they should be restored)
  const r2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  console.log('[15] re-fillet result:', JSON.stringify(r2.result))
  console.log('[15] re-fillet maxLevel:', r2.maxLevel)

  filewrite({ first: r1.result, redo: r2.result }, 'undo-redo-results')
  await snapshot('re-filleted')

  return { partId }
}
