export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'EdgeCases' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Test 1: Group with empty instanceIds
  const r1 = await api.v1.assembly.group({
    id: asmId, name: 'EmptyGroup', instanceIds: [],
  })
  console.log('[04] empty instanceIds — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[04] empty messages:', JSON.stringify(r1.messages))

  // Test 2: Group with single instance
  const r2 = await api.v1.assembly.group({
    id: asmId, name: 'SingleGroup', instanceIds: [inst1],
  })
  console.log('[04] single instance — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: Group with duplicate instance IDs
  const r3 = await api.v1.assembly.group({
    id: asmId, name: 'DupGroup', instanceIds: [inst1, inst1, inst1],
  })
  console.log('[04] duplicate ids — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.result) {
    const info = (await api.v1.assembly.getGroup({ id: asmId, name: 'DupGroup' })).result
    console.log('[04] duplicate group info:', JSON.stringify(info))
  }

  // Test 4: Group with nonexistent instance ID
  const r4 = await api.v1.assembly.group({
    id: asmId, name: 'BadIdGroup', instanceIds: [99999],
  })
  console.log('[04] nonexistent id — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[04] bad id messages:', JSON.stringify(r4.messages))

  // Test 5: Group with mix of valid and invalid IDs
  const r5 = await api.v1.assembly.group({
    id: asmId, name: 'MixedGroup', instanceIds: [inst1, 99999],
  })
  console.log('[04] mixed ids — result:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[04] mixed messages:', JSON.stringify(r5.messages))

  // Test 6: Same instance in multiple groups
  const gA = (await api.v1.assembly.group({
    id: asmId, name: 'GroupA', instanceIds: [inst1, inst2],
  })).result
  const gB = (await api.v1.assembly.group({
    id: asmId, name: 'GroupB', instanceIds: [inst1],
  })).result
  console.log('[04] same instance in 2 groups — gA:', gA, 'gB:', gB)
  const infoA = (await api.v1.assembly.getGroup({ id: asmId, name: 'GroupA' })).result
  const infoB = (await api.v1.assembly.getGroup({ id: asmId, name: 'GroupB' })).result
  console.log('[04] GroupA:', JSON.stringify(infoA))
  console.log('[04] GroupB:', JSON.stringify(infoB))

  // Test 7: Missing instanceIds param entirely
  const r7 = await api.v1.assembly.group({
    id: asmId, name: 'NoIdsGroup',
  })
  console.log('[04] missing instanceIds — result:', r7.result, 'maxLevel:', r7.maxLevel)
  if (r7.messages?.length) console.log('[04] missing ids messages:', JSON.stringify(r7.messages))

  filewrite({
    emptyIds: { result: r1.result, maxLevel: r1.maxLevel },
    singleId: { result: r2.result, maxLevel: r2.maxLevel },
    dupIds: { result: r3.result, maxLevel: r3.maxLevel },
    badId: { result: r4.result, maxLevel: r4.maxLevel },
    mixedIds: { result: r5.result, maxLevel: r5.maxLevel },
    missingIds: { result: r7.result, maxLevel: r7.maxLevel },
  }, 'edge-cases')

  return { asmId }
}
