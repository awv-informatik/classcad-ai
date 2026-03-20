// 12: undoFillet — with wrong arcId (not from fillet, use a circle or line)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UndoWrong' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Try undoFillet with a line ID (not an arc)
  const r1 = await execute({ 'v1.sketch.undoFillet': [{ id: skId, arcId: lines[0] }] })
  console.log('undoFillet with line ID:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }))

  // Try with invalid ID
  const r2 = await execute({ 'v1.sketch.undoFillet': [{ id: skId, arcId: 99999 }] })
  console.log('undoFillet with bad ID:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }))

  return { done: true }
}
