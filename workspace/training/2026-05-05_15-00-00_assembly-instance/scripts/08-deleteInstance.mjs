export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create 4 instances
  const ids = (await api.v1.assembly.instance([
    { productId: tplId, ownerId: asmId, name: 'A' },
    { productId: tplId, ownerId: asmId, name: 'B', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { productId: tplId, ownerId: asmId, name: 'C', transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { productId: tplId, ownerId: asmId, name: 'D', transformation: [[180, 0, 0], [1, 0, 0], [0, 1, 0]] },
  ])).result
  console.log('[08] created:', JSON.stringify(ids))

  await snapshot('before-delete')

  // Delete one instance
  const r1 = await api.v1.assembly.deleteInstance({ ids: [ids[1]] })
  console.log('[08] delete B:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Verify remaining
  const remaining1 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] remaining after delete B:', JSON.stringify(remaining1.result))

  await snapshot('after-delete-B')

  // Delete multiple at once
  const r2 = await api.v1.assembly.deleteInstance({ ids: [ids[2], ids[3]] })
  console.log('[08] delete C+D:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  const remaining2 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] remaining after delete C+D:', JSON.stringify(remaining2.result))

  // Delete already-deleted instance
  const r3 = await api.v1.assembly.deleteInstance({ ids: [ids[1]] })
  console.log('[08] re-delete B:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[08] re-delete msgs:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 're-delete-response')

  // Delete with empty array
  const r4 = await api.v1.assembly.deleteInstance({ ids: [] })
  console.log('[08] empty ids:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[08] empty msgs:', JSON.stringify(r4.messages))

  // Delete with invalid ID
  const r5 = await api.v1.assembly.deleteInstance({ ids: [999999] })
  console.log('[08] invalid id:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[08] invalid msgs:', JSON.stringify(r5.messages))
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'invalid-delete-response')

  await snapshot('after-all-deletes')

  // Verify: only A should remain
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[08] root mass:', JSON.stringify(rootMass.result))
  // Only inst A at origin, COG=[20,15,10], volume=24000
  console.log('[08] predicted: COG=[20,15,10] volume=24000')

  return { remaining: remaining2.result }
}
