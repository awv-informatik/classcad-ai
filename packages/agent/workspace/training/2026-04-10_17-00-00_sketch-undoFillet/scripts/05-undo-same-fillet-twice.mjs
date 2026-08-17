// Test: What happens if you undo the same fillet twice?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoTwice' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet one corner
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], offset: 10 })
  const [arcId] = f.result
  console.log('[05] fillet arcId:', arcId)

  // First undo — should succeed
  const u1 = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[05] first undo: result=', u1.result, 'maxLevel=', u1.maxLevel, 'messages=', JSON.stringify(u1.messages))

  // Second undo — same arcId, arc no longer exists
  const u2 = await api.v1.sketch.undoFillet({ id: skId, arcId })
  console.log('[05] second undo: result=', u2.result, 'maxLevel=', u2.maxLevel, 'messages=', JSON.stringify(u2.messages))

  filewrite({ firstUndo: { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages },
              secondUndo: { result: u2.result, maxLevel: u2.maxLevel, messages: u2.messages } }, 'double-undo')

  return { partId }
}
