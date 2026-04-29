export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances — two with the same name "Dup"
  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Alpha' })).result
  const i2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Dup' })).result
  const i3 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Dup' })).result
  const i4 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Omega' })).result

  console.log('[04] created:', i1, i2, i3, i4)

  // Batch query
  const rBatch = await api.v1.assembly.getInstance([
    { ownerId: asmId, name: 'Alpha' },
    { ownerId: asmId, name: 'Omega' },
    { ownerId: asmId, name: 'NoSuch' },
  ])
  console.log('[04] batch result:', JSON.stringify(rBatch.result))
  console.log('[04] batch maxLevel:', rBatch.maxLevel)

  // Duplicate name lookup — which one is returned?
  const rDup = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Dup' })
  console.log('[04] dup result:', rDup.result, '(i2=', i2, ', i3=', i3, ')')
  console.log('[04] dup is first?', rDup.result === i2)

  // Get all — check ordering
  const rAll = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[04] all result:', JSON.stringify(rAll.result))
  console.log('[04] all matches creation order?', JSON.stringify(rAll.result) === JSON.stringify([i1, i2, i3, i4]))

  filewrite({
    ids: { i1, i2, i3, i4 },
    batch: { result: rBatch.result, maxLevel: rBatch.maxLevel, messages: rBatch.messages },
    duplicate: { result: rDup.result, maxLevel: rDup.maxLevel },
    all: { result: rAll.result, ordered: JSON.stringify(rAll.result) === JSON.stringify([i1, i2, i3, i4]) },
  }, 'batch-dup')

  return { asmId }
}
