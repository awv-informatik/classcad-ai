export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[20, 30, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG before:', JSON.stringify(massBefore?.cog))

  // Test 1: Identity matrix (should be no-op)
  const r1 = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
  })
  console.log('[07] identity result:', r1.result, 'maxLevel:', r1.maxLevel)
  const massIdentity = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG after identity:', JSON.stringify(massIdentity?.cog))

  // Test 2: Left-handed matrix (mirror — det(R) = -1)
  const r2 = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[-1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
  })
  console.log('[07] left-handed result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] left-handed messages:', JSON.stringify(r2.messages))

  // Test 3: Missing transformation param
  const r3 = await api.v1.assembly.transformInstance({ id: inst1 })
  console.log('[07] missing transform result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] missing transform messages:', JSON.stringify(r3.messages))

  // Test 4: Invalid ID
  const r4 = await api.v1.assembly.transformInstance({
    id: 999999,
    transformation: [[1,0,0,10],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
  })
  console.log('[07] invalid id result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[07] invalid id messages:', JSON.stringify(r4.messages))

  // Test 5: Non-orthogonal matrix
  const r5 = await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[2,0,0,0],[0,2,0,0],[0,0,2,0],[0,0,0,1]], // scaling matrix
  })
  console.log('[07] scale matrix result:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[07] scale matrix messages:', JSON.stringify(r5.messages))

  // Verify COG hasn't changed from any failed/identity operations
  const massFinal = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[07] COG final:', JSON.stringify(massFinal?.cog))

  filewrite({
    cogBefore: massBefore?.cog,
    cogAfterIdentity: massIdentity?.cog,
    cogFinal: massFinal?.cog,
    identityResult: { result: r1.result, maxLevel: r1.maxLevel },
    leftHandedResult: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    missingTransform: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    invalidId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    scaleMatrix: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'results')

  return { asmId, inst1 }
}
