// Test: After undoFillet, can you re-fillet with different parameters?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoRefillet' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet with small radius
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 5 })
  console.log('[13] first fillet (r=5):', JSON.stringify(f1.result), 'maxLevel:', f1.maxLevel)
  await snapshot('fillet-r5')

  // Undo
  const u = await api.v1.sketch.undoFillet({ id: skId, arcId: f1.result[0] })
  console.log('[13] undo: maxLevel=', u.maxLevel)

  // Re-fillet with much larger radius
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 25 })
  console.log('[13] second fillet (r=25):', JSON.stringify(f2.result), 'maxLevel:', f2.maxLevel)
  await snapshot('fillet-r25')

  // Undo again
  const u2 = await api.v1.sketch.undoFillet({ id: skId, arcId: f2.result[0] })
  console.log('[13] second undo: maxLevel=', u2.maxLevel)

  // Re-fillet with offset instead of radius
  const f3 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 20 })
  console.log('[13] third fillet (offset=20):', JSON.stringify(f3.result), 'maxLevel:', f3.maxLevel)
  await snapshot('fillet-offset20')

  filewrite({
    fillet1: { params: { radius: 5 }, result: f1.result },
    fillet2: { params: { radius: 25 }, result: f2.result },
    fillet3: { params: { offset: 20 }, result: f3.result }
  }, 'refillet-results')

  return { partId }
}
