// 11: undoFillet — basic + verify restoration
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UndoFillet' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Fillet one corner
  const fRes = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 15 }] })
  const arcId = fRes.result[0]
  console.log('Fillet created, arcId:', arcId)
  await snapshot('after-fillet')

  // Undo it
  const undoRes = await execute({ 'v1.sketch.undoFillet': [{ id: skId, arcId }] })
  console.log('undoFillet:', JSON.stringify({ result: undoRes.result, messages: undoRes.messages, maxLevel: undoRes.maxLevel }))
  await snapshot('after-undo')

  return { arcId, undoResult: undoRes.result }
}
