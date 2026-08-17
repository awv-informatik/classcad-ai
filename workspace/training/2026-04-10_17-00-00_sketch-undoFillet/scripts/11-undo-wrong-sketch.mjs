// Test: What happens if you pass the wrong sketch ID to undoFillet?
// Create fillet in sketch1, try to undo in sketch2.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoWrongSketch' })).result
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const rect1 = await api.v1.sketch.rectangle({ id: sk1, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect1.result

  // Fillet in sketch1
  const f = await api.v1.sketch.fillet({ id: sk1, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId] = f.result
  console.log('[11] fillet in sk1, arcId:', arcId)

  // Create a second sketch
  const sk2 = (await api.v1.sketch.create({ id: partId })).result
  console.log('[11] sk1:', sk1, 'sk2:', sk2)

  // Try to undo using sketch2 instead of sketch1
  const u = await api.v1.sketch.undoFillet({ id: sk2, arcId })
  console.log('[11] undo in wrong sketch: result=', u.result, 'maxLevel=', u.maxLevel, 'messages=', JSON.stringify(u.messages))
  filewrite({ result: u.result, maxLevel: u.maxLevel, messages: u.messages }, 'wrong-sketch-undo')

  return { partId }
}
