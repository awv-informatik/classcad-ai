// Test: Does undoFillet affect other geometry in the sketch?
// Add extra lines/circles to the sketch, fillet, undo, verify extras are untouched.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoPreserves' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Add extra geometry — a circle and a line
  const circ = await api.v1.sketch.circle({ id: skId, center: [40, 30, 0], radius: 10 })
  const extraLine = await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [70, 50, 0] })
  console.log('[15] circle:', circ.result, 'extraLine:', extraLine.result)

  const geoBefore = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoBefore.result, 'geo-before')

  // Fillet one corner of rectangle
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId] = f.result

  const geoAfterFillet = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoAfterFillet.result, 'geo-after-fillet')

  // Undo
  await api.v1.sketch.undoFillet({ id: skId, arcId })

  const geoAfterUndo = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geoAfterUndo.result, 'geo-after-undo')

  // Check circle and extra line still exist
  const circleExists = geoAfterUndo.result.circles?.includes(circ.result)
  const lineExists = geoAfterUndo.result.lines?.includes(extraLine.result)
  console.log('[15] circle exists after undo:', circleExists, 'extra line exists:', lineExists)
  console.log('[15] before geo:', JSON.stringify(geoBefore.result))
  console.log('[15] after undo geo:', JSON.stringify(geoAfterUndo.result))
  console.log('[15] geo matches:', JSON.stringify(geoBefore.result) === JSON.stringify(geoAfterUndo.result))

  return { partId }
}
