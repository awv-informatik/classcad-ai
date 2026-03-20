// 06: Edge cases — offset 0, negative offset, too large, micro-radius
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'EdgeCases' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Test 1: offset=0
  const r1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 0 }] })
  console.log('offset=0:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }))

  // Test 2: offset=-5
  const r2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[1], lines[2]], offset: -5 }] })
  console.log('offset=-5:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }))

  // Test 3: offset > line length (line is 80, offset=100)
  const r3 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[2], lines[3]], offset: 100 }] })
  console.log('offset=100 (too large):', JSON.stringify({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }))

  // Test 4: micro radius=0.001
  const r4 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[2], lines[3]], radius: 0.001 }] })
  console.log('radius=0.001:', JSON.stringify({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }))

  await snapshot('edge-cases')

  return { done: true }
}
