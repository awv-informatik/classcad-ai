// Q: Can a result be non-null while maxLevel indicates error? What does this mean for failure detection?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Boolean UNION with non-overlapping bodies
  const box1 = (await api.v1.part.box({ id: partId, xLen: 50, yLen: 50, zLen: 50 })).result
  const box2 = (await api.v1.part.box({ id: partId, xLen: 50, yLen: 50, zLen: 50, pos: [200, 200, 200] })).result

  const rUnion = await api.v1.part.boolean({ id: partId, type: 'UNION', target: box1, tools: [box2] })
  console.log('[05] UNION non-overlap:', JSON.stringify({ result: rUnion.result, messages: rUnion.messages, maxLevel: rUnion.maxLevel }, null, 2))

  // Boolean INTERSECTION with non-overlapping bodies
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const box3 = (await api.v1.part.box({ id: partId2, xLen: 50, yLen: 50, zLen: 50 })).result
  const box4 = (await api.v1.part.box({ id: partId2, xLen: 50, yLen: 50, zLen: 50, pos: [200, 200, 200] })).result

  const rInter = await api.v1.part.boolean({ id: partId2, type: 'INTERSECTION', target: box3, tools: [box4] })
  console.log('[05] INTERSECTION non-overlap:', JSON.stringify({ result: rInter.result, messages: rInter.messages, maxLevel: rInter.maxLevel }, null, 2))

  // Boolean SUBTRACTION with overlapping bodies (should work fine)
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const box5 = (await api.v1.part.box({ id: partId3, xLen: 100, yLen: 100, zLen: 100 })).result
  const box6 = (await api.v1.part.box({ id: partId3, xLen: 50, yLen: 50, zLen: 50, pos: [25, 25, 25] })).result

  const rSub = await api.v1.part.boolean({ id: partId3, type: 'SUBTRACTION', target: box5, tools: [box6] })
  console.log('[05] SUBTRACTION overlapping:', JSON.stringify({ result: rSub.result, messages: rSub.messages, maxLevel: rSub.maxLevel }, null, 2))
}
