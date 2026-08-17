export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorCases' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result

  // Test 1: invalid tool ID (non-existent)
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [99999],
  })
  console.log('[18] invalid tool ID — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'invalid-tool')

  // Test 2: same feature as target and tool (self-reference)
  // WARNING: this might hang the server like solid.* does. Be cautious.
  const partId2 = (await api.v1.part.create({ name: 'SelfRef' })).result
  const box2 = (await api.v1.part.box({ id: partId2, name: 'Self', length: 60, width: 40, height: 30 })).result

  const r2 = await api.v1.part.boolean({
    id: partId2,
    type: 'UNION',
    target: box2,
    tools: [box2],
  })
  console.log('[18] self-reference — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'self-ref')

  // Test 3: invalid part ID
  const partId3 = (await api.v1.part.create({ name: 'BadPartId' })).result
  const box3 = (await api.v1.part.box({ id: partId3, name: 'A', length: 60, width: 40, height: 30 })).result
  const box4 = (await api.v1.part.box({ id: partId3, name: 'B', length: 30, width: 30, height: 50, translation: [30, 10, 0] })).result

  const r3 = await api.v1.part.boolean({
    id: 99999,
    type: 'UNION',
    target: box3,
    tools: [box4],
  })
  console.log('[18] invalid part ID — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'invalid-part')

  return { partId }
}
