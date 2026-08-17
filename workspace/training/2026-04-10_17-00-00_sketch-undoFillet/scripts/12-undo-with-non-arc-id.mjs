// Test: What happens if you pass a non-arc ID (e.g., a line ID) to undoFillet?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UndoNonArc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Try to undo with a line ID instead of an arc ID
  const u1 = await api.v1.sketch.undoFillet({ id: skId, arcId: lineIds[0] })
  console.log('[12] undo with line ID: result=', u1.result, 'maxLevel=', u1.maxLevel, 'messages=', JSON.stringify(u1.messages))

  // Try with sketch ID
  const u2 = await api.v1.sketch.undoFillet({ id: skId, arcId: skId })
  console.log('[12] undo with sketch ID: result=', u2.result, 'maxLevel=', u2.maxLevel, 'messages=', JSON.stringify(u2.messages))

  // Try with part ID
  const u3 = await api.v1.sketch.undoFillet({ id: skId, arcId: partId })
  console.log('[12] undo with part ID: result=', u3.result, 'maxLevel=', u3.maxLevel, 'messages=', JSON.stringify(u3.messages))

  filewrite({
    lineId: { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages },
    sketchId: { result: u2.result, maxLevel: u2.maxLevel, messages: u2.messages },
    partId: { result: u3.result, maxLevel: u3.maxLevel, messages: u3.messages }
  }, 'non-arc-undo-results')

  return { partId }
}
