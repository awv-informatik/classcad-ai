// Q: Which boolean types produce error messages with non-overlapping bodies?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // UNION with non-overlapping
  const box1 = (await api.v1.part.box({ id: partId, xLen: 50, yLen: 50, zLen: 50 })).result
  const box2 = (await api.v1.part.box({ id: partId, xLen: 50, yLen: 50, zLen: 50, pos: [200, 200, 200] })).result
  const rUnion = await api.v1.part.boolean({ id: partId, type: 'UNION', target: box1, tools: [box2] })
  console.log('[06] UNION non-overlap:', JSON.stringify({ result: rUnion.result, msgs: rUnion.messages.length, maxLevel: rUnion.maxLevel }))

  // Reset for next test
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result

  // SUBTRACTION with non-overlapping
  const box3 = (await api.v1.part.box({ id: partId2, xLen: 50, yLen: 50, zLen: 50 })).result
  const box4 = (await api.v1.part.box({ id: partId2, xLen: 50, yLen: 50, zLen: 50, pos: [200, 200, 200] })).result
  const rSub = await api.v1.part.boolean({ id: partId2, type: 'SUBTRACTION', target: box3, tools: [box4] })
  console.log('[06] SUBTRACTION non-overlap:', JSON.stringify({ result: rSub.result, msgs: rSub.messages, maxLevel: rSub.maxLevel }, null, 2))

  // Reset for next test
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result

  // INTERSECTION with non-overlapping
  const box5 = (await api.v1.part.box({ id: partId3, xLen: 50, yLen: 50, zLen: 50 })).result
  const box6 = (await api.v1.part.box({ id: partId3, xLen: 50, yLen: 50, zLen: 50, pos: [200, 200, 200] })).result
  const rInter = await api.v1.part.boolean({ id: partId3, type: 'INTERSECTION', target: box5, tools: [box6] })
  console.log('[06] INTERSECTION non-overlap:', JSON.stringify({ result: rInter.result, msgs: rInter.messages, maxLevel: rInter.maxLevel }, null, 2))
}
