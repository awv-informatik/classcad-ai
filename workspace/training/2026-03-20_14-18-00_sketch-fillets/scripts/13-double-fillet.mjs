// 13: Fillet same corner twice — what happens?
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'DoubleFillet' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Fillet corner 1
  const f1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10 }] })
  console.log('First fillet:', JSON.stringify({ result: f1.result, messages: f1.messages }))
  await snapshot('first-fillet')

  // Try same lineIds again
  const f2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 5 }] })
  console.log('Second fillet same corner:', JSON.stringify({ result: f2.result, messages: f2.messages, maxLevel: f2.maxLevel }))
  await snapshot('second-fillet-attempt')

  return { f1: f1.result, f2: f2.result }
}
