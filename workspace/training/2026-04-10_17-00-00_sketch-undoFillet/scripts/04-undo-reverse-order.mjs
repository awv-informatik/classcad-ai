// Test: Does undo order matter? Fillet 4 corners, undo in REVERSE order.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoReverse' })).result
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
    fillets.push(f.result)
  }
  await snapshot('all-filleted')

  // Undo in REVERSE order (last created, first undone)
  const undoResults = []
  for (let i = 3; i >= 0; i--) {
    const arcId = fillets[i][0]
    const u = await api.v1.sketch.undoFillet({ id: skId, arcId })
    console.log(`[04] undo fillet ${i} (reverse): maxLevel=${u.maxLevel}`)
    undoResults.push({ corner: i, maxLevel: u.maxLevel, messages: u.messages })
  }
  filewrite(undoResults, 'undo-reverse-results')
  await snapshot('all-undone-reverse')

  const geoFinal = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[04] final geo:', JSON.stringify(geoFinal.result))
  filewrite(geoFinal.result, 'geo-final')

  return { partId }
}
