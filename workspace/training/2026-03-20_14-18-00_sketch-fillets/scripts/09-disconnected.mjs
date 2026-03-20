// 09: Disconnected lines — no shared point
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'NoIncident' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const l1 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] }] })).result
  const l2 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [60, 10, 0], endPos: [100, 50, 0] }] })).result

  const res = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [l1, l2], offset: 10 }] })
  console.log('Disconnected:', JSON.stringify({ result: res.result, messages: res.messages, maxLevel: res.maxLevel }))

  return { result: res.result }
}
