export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: missing productId
  const r1 = await api.v1.assembly.instance({ ownerId: asmId })
  console.log('[09] no productId:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[09] msgs:', JSON.stringify(r1.messages[0]))

  // Test 2: missing ownerId
  const r2 = await api.v1.assembly.instance({ productId: tplId })
  console.log('[09] no ownerId:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[09] msgs:', JSON.stringify(r2.messages[0]))

  // Test 3: invalid productId
  const r3 = await api.v1.assembly.instance({ productId: 999999, ownerId: asmId })
  console.log('[09] invalid productId:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[09] msgs:', JSON.stringify(r3.messages[0]))

  // Test 4: part ID as ownerId (not assembly or instance)
  const r4 = await api.v1.assembly.instance({ productId: tplId, ownerId: tplId })
  console.log('[09] tplId as owner:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[09] msgs:', JSON.stringify(r4.messages[0]))

  // Test 5: instance an assembly template (not just part template)
  const subAsmId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  // Add a box instance to the sub-assembly
  const innerInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subAsmId, name: 'Inner' })).result
  console.log('[09] inner inst in sub-asm:', innerInst)

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const r5 = await api.v1.assembly.instance({
    productId: subAsmId, ownerId: asmId, name: 'SubAsmInst',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[09] sub-asm instance:', r5.result, 'maxLevel:', r5.maxLevel)

  // Test 6: string identifier for productId (use template name)
  const r6 = await api.v1.assembly.instance({
    productId: 'Box', ownerId: asmId, name: 'ByName',
    transformation: [[160, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[09] string productId:', r6.result, 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[09] msgs:', JSON.stringify(r6.messages[0]))

  // Test 7: non-orthogonal matrix (scaling/shear)
  const r7 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'NonOrtho',
    transformation: [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1]],
  })
  console.log('[09] non-ortho matrix:', r7.result, 'maxLevel:', r7.maxLevel)
  if (r7.messages?.length) console.log('[09] msgs:', JSON.stringify(r7.messages[0]))

  await snapshot('error-cases')
  filewrite({
    noProductId: { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message },
    noOwnerId: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message },
    invalidProductId: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message },
    tplAsOwner: { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message },
    subAsmInst: { result: r5.result, maxLevel: r5.maxLevel },
    stringProductId: { result: r6.result, maxLevel: r6.maxLevel, msg: r6.messages?.[0]?.message },
    nonOrtho: { result: r7.result, maxLevel: r7.maxLevel, msg: r7.messages?.[0]?.message },
  }, 'error-summary')

  return {}
}
