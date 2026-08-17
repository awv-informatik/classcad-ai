// Test: Does undoFillet work on a negative-offset (exterior) fillet?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoNegOffset' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  await snapshot('before-neg-fillet')

  // Apply negative offset fillet (exterior fillet)
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: -15 })
  console.log('[06] neg fillet result:', JSON.stringify(f.result), 'maxLevel:', f.maxLevel)
  const [arcId] = f.result
  await snapshot('after-neg-fillet')

  // Undo the negative offset fillet
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[06] undo result:', u.result, 'maxLevel:', u.maxLevel)
  await snapshot('after-undo-neg')

  // Verify geometry restored
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] geo after undo:', JSON.stringify(geo.result))
  filewrite(geo.result, 'geo-after-undo-neg')

  return { partId }
}
