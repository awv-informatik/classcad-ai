export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create 3 instances
  const inst0 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Alpha' })).result
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Beta',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Gamma',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  console.log('[07] created:', inst0, inst1, inst2)

  // Test 1: get all instances from owner (no name filter)
  const r1 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[07] all instances:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Test 2: get by name
  const r2 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Beta' })
  console.log('[07] Beta:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Test 3: get nonexistent name
  const r3 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'NoSuch' })
  console.log('[07] NoSuch:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] NoSuch messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'nosuch-response')

  // Test 4: array form
  const r4 = await api.v1.assembly.getInstance([
    { ownerId: asmId, name: 'Alpha' },
    { ownerId: asmId, name: 'Gamma' },
  ])
  console.log('[07] array form:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Test 5: get from wrong ownerId (e.g., template ID instead of assembly root)
  const r5 = await api.v1.assembly.getInstance({ ownerId: tplId })
  console.log('[07] wrong owner (tplId):', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[07] wrong owner msgs:', JSON.stringify(r5.messages))

  // Test 6: get all instances with no owner (missing param)
  const r6 = await api.v1.assembly.getInstance({})
  console.log('[07] no owner:', JSON.stringify(r6.result), 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[07] no owner msgs:', JSON.stringify(r6.messages))
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'no-owner-response')

  return { all: r1.result, beta: r2.result, nosuch: r3.result, array: r4.result }
}
