// Test: Can you undo multiple fillets on the same rectangle?
// Fillet all 4 corners, then undo them one by one.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoMultiple' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet all 4 corners
  const fillets = []
  for (let i = 0; i < 4; i++) {
    const f = await api.v1.sketch.fillet({
      id: skId,
      lineIds: [lineIds[i], lineIds[(i + 1) % 4]],
      radius: 8
    })
    console.log(`[03] fillet corner ${i}: result=${JSON.stringify(f.result)} maxLevel=${f.maxLevel}`)
    fillets.push(f.result)
  }
  await snapshot('all-4-filleted')

  // Undo them one by one (FIFO order — first created, first undone)
  const undoResults = []
  for (let i = 0; i < 4; i++) {
    const arcId = fillets[i][0]
    const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
    console.log(`[03] undo fillet ${i}: result=${u.result} maxLevel=${u.maxLevel} messages=${JSON.stringify(u.messages)}`)
    undoResults.push({ corner: i, result: u.result, maxLevel: u.maxLevel, messages: u.messages })
  }
  filewrite(undoResults, 'undo-results')
  await snapshot('all-undone')

  // Check final geometry
  const geoFinal = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoFinal.result, 'geo-final')
  console.log('[03] final geo:', JSON.stringify(geoFinal.result))

  return { partId }
}
