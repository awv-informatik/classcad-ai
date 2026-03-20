// 08: Error cases — empty tools, missing target, wrong IDs
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'ErrCases' }] })).result

  const sk1 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l1 = (await execute({ 'v1.sketch.rectangle': [{ id: sk1, startPos: [0, 0, 0], endPos: [100, 100, 0] }] })).result
  const r1 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk1, geomIds: l1 }] })).result
  const ext1 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r1], limit2: 60 }] })).result

  // Test 1: Empty tools array
  const res1 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [] }] })
  console.log('Empty tools:', JSON.stringify({ result: res1.result, messages: res1.messages, maxLevel: res1.maxLevel }))

  // Test 2: Invalid tool ID (99999)
  const res2 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [99999] }] })
  console.log('Invalid tool ID:', JSON.stringify({ result: res2.result, messages: res2.messages, maxLevel: res2.maxLevel }))

  // Test 3: Missing target (omit target param)
  const res3 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', tools: [ext1] }] })
  console.log('Missing target:', JSON.stringify({ result: res3.result, messages: res3.messages, maxLevel: res3.maxLevel }))

  // Test 4: Invalid type string
  const sk2 = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  const l2 = (await execute({ 'v1.sketch.rectangle': [{ id: sk2, startPos: [10, 10, 0], endPos: [50, 50, 0] }] })).result
  const r2 = (await execute({ 'v1.sketch.sketchRegion': [{ id: sk2, geomIds: l2 }] })).result
  const ext2 = (await execute({ 'v1.part.extrusion': [{ id: partId, references: [r2], limit2: 40 }] })).result

  const res4 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'INVALID_TYPE', target: ext1, tools: [ext2] }] })
  console.log('Invalid type:', JSON.stringify({ result: res4.result, messages: res4.messages, maxLevel: res4.maxLevel }))

  // Test 5: Same feature as both target and tool
  const res5 = await execute({ 'v1.part.boolean': [{ id: partId, type: 'UNION', target: ext1, tools: [ext1] }] })
  console.log('Same target+tool:', JSON.stringify({ result: res5.result, messages: res5.messages, maxLevel: res5.maxLevel }))

  return { done: true }
}
