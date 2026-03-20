// 07: Non-line geometry — try fillet with arc/circle IDs
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'NonLine' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  // Create a line and a circle
  const line1 = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] }] })).result
  const circle = (await execute({ 'v1.sketch.circle': [{ id: skId, center: [80, 0, 0], radius: 20 }] })).result

  // Try fillet with line + circle
  const r1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [line1, circle] }] })
  console.log('line+circle:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }))

  // Create an arc
  const arc = (await execute({ 'v1.sketch.arcByThreePoints': [{ id: skId, startPos: [0, 30, 0], midPos: [25, 50, 0], endPos: [50, 30, 0] }] })).result

  // Try fillet with line + arc
  const r2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [line1, arc] }] })
  console.log('line+arc:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }))

  return { done: true }
}
