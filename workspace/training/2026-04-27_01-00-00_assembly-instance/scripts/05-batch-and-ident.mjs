export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Batch creation — array of param objects
  const rBatch = await api.v1.assembly.instance([
    { productId: tplId, ownerId: asmId, name: 'W1', transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { productId: tplId, ownerId: asmId, name: 'W2', transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { productId: tplId, ownerId: asmId, name: 'W3', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] },
  ])
  console.log('[05] batch result:', rBatch.result)
  console.log('[05] batch result type:', typeof rBatch.result, Array.isArray(rBatch.result))
  console.log('[05] batch maxLevel:', rBatch.maxLevel)
  filewrite({ batchResult: rBatch.result, messages: rBatch.messages, maxLevel: rBatch.maxLevel }, 'batch-result')

  // Ident parameter
  const rIdent = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'IdentWidget',
    ident: 'my-custom-ident-123',
    transformation: [[90, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[05] ident instance result:', rIdent.result, 'maxLevel:', rIdent.maxLevel)

  // Can we look up by ident? Try getInstance with name = ident
  const rLookup1 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'my-custom-ident-123' })
  console.log('[05] getInstance by ident string:', rLookup1.result, 'maxLevel:', rLookup1.maxLevel)

  // Lookup by actual name
  const rLookup2 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'IdentWidget' })
  console.log('[05] getInstance by name:', rLookup2.result)

  // Batch with one error in the middle — does it partial-succeed?
  const rMixed = await api.v1.assembly.instance([
    { productId: tplId, ownerId: asmId, name: 'Good1' },
    { productId: 9999, ownerId: asmId, name: 'Bad1' },
    { productId: tplId, ownerId: asmId, name: 'Good2' },
  ])
  console.log('[05] mixed batch result:', rMixed.result)
  console.log('[05] mixed batch maxLevel:', rMixed.maxLevel)
  if (rMixed.messages?.length) console.log('[05] mixed batch msgs:', rMixed.messages.length)
  filewrite({ mixedResult: rMixed.result, messages: rMixed.messages, maxLevel: rMixed.maxLevel }, 'mixed-batch')

  await snapshot('batch-instances')
  return { asmId, tplId }
}
