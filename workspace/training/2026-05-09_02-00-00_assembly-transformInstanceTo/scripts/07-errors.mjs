export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
  })).result

  // Test 1: missing transformation
  const r1 = await api.v1.assembly.transformInstanceTo({ id: inst })
  console.log('[07] missing transformation:', r1.maxLevel, r1.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'missing-transformation')

  // Test 2: missing id
  const r2 = await api.v1.assembly.transformInstanceTo({
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[07] missing id:', r2.maxLevel, r2.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'missing-id')

  // Test 3: invalid id
  const r3 = await api.v1.assembly.transformInstanceTo({
    id: 99999,
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[07] invalid id:', r3.maxLevel, r3.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'invalid-id')

  // Test 4: wrong array size (only 2 points instead of 3)
  const r4 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[10, 0, 0], [1, 0, 0]],
  })
  console.log('[07] 2-point array:', r4.maxLevel, r4.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, '2-point-array')

  // Test 5: empty transformation array
  const r5 = await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [],
  })
  console.log('[07] empty array:', r5.maxLevel, r5.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'empty-array')

  // Test 6: part template ID instead of instance ID
  const r6 = await api.v1.assembly.transformInstanceTo({
    id: tplId,
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[07] template id:', r6.maxLevel, r6.messages?.[0]?.message?.slice(0, 80))
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'template-id')

  return { inst, asmId }
}
