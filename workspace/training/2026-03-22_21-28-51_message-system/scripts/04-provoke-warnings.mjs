// Q: What operations produce warnings? Try: fillet on wrong edge, boolean with no overlap, etc.
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Create two boxes that don't overlap for a boolean
  const box1 = (await execute({ 'v1.part.box': [{ id: partId, xLen: 50, yLen: 50, zLen: 50, name: 'box1' }] })).result
  const box2 = (await execute({ 'v1.part.box': [{ id: partId, xLen: 50, yLen: 50, zLen: 50, name: 'box2', pos: [200, 200, 200] }] })).result

  // Boolean subtraction with non-overlapping bodies
  const r1 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'SUBTRACTION', target: box1, tools: [box2] }] })
  console.log('[04] non-overlapping boolean:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, null, 2))

  // Fillet with radius larger than the edge
  const box3 = (await execute({ 'v1.part.box': [{ id: partId, xLen: 10, yLen: 10, zLen: 10, name: 'box3' }] })).result
  const r2 = await execute({ 'v1.part.fillet': [{ id: partId, radius: 100 }] })
  console.log('[04] oversized fillet:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, null, 2))

  // evaluateExpression with silent=TRUE on bad expression
  const r3 = await execute({ 'v1.common.evaluateExpression': [{ expression: 'bad!!!', silent: true }] })
  console.log('[04] silent bad expr:', JSON.stringify({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, null, 2))

  // evaluateExpression with silent=FALSE on bad expression
  const r4 = await execute({ 'v1.common.evaluateExpression': [{ expression: 'bad!!!', silent: false }] })
  console.log('[04] non-silent bad expr:', JSON.stringify({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, null, 2))
}
