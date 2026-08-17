// Test: Undo only SOME fillets — does it leave others intact?
// Fillet 4 corners, undo just corners 0 and 2, check corners 1 and 3 survive.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoPartial' })).result
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
    console.log(`[09] fillet corner ${i}: ${JSON.stringify(f.result)}`)
  }
  await snapshot('all-4-filleted')

  // Undo only corners 0 and 2
  const u0 = await api.v1.sketch.undoFillet({ id: skId, arcId: fillets[0][0] })
  console.log('[09] undo corner 0: maxLevel=', u0.maxLevel)
  const u2 = await api.v1.sketch.undoFillet({ id: skId, arcId: fillets[2][0] })
  console.log('[09] undo corner 2: maxLevel=', u2.maxLevel)

  await snapshot('corners-1-3-remain')

  // Check geometry — should have 2 arcs remaining (corners 1 and 3)
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] arcs remaining:', geo.result.arcs?.length, 'lines:', geo.result.lines?.length)
  filewrite(geo.result, 'geo-partial-undo')

  return { partId }
}
