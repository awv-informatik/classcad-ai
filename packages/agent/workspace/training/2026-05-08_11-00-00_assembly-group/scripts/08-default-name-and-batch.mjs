// Test default name, batch creation of multiple groups, and array variant
export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I2', transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I3', transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst4 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I4', transformation: [[50, 50, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Default name (no name param)
  const r1 = await api.v1.assembly.group({ id: asmId, instanceIds: [inst1, inst2] })
  console.log('[08] default name group result:', r1.result, 'maxLevel:', r1.maxLevel)
  const g1 = await api.v1.assembly.getGroup({ id: asmId, name: 'Group' })
  console.log('[08] default name getGroup:', JSON.stringify(g1.result))
  filewrite(g1.result, 'default-name')

  // Array/batch variant: create multiple groups in one call
  const r2 = await api.v1.assembly.group([
    { id: asmId, name: 'Batch1', instanceIds: [inst1, inst3] },
    { id: asmId, name: 'Batch2', instanceIds: [inst2, inst4] },
  ])
  console.log('[08] batch group result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'batch-create')

  // Verify batch groups
  const gb1 = await api.v1.assembly.getGroup({ id: asmId, name: 'Batch1' })
  const gb2 = await api.v1.assembly.getGroup({ id: asmId, name: 'Batch2' })
  console.log('[08] Batch1:', JSON.stringify(gb1.result))
  console.log('[08] Batch2:', JSON.stringify(gb2.result))
  filewrite({ batch1: gb1.result, batch2: gb2.result }, 'batch-verify')

  // Batch updateGroup
  const r3 = await api.v1.assembly.updateGroup([
    { id: gb1.result.id, name: 'RenameBatch1' },
    { id: gb2.result.id, instanceIds: [inst1, inst2, inst3, inst4] },
  ])
  console.log('[08] batch updateGroup result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'batch-update')

  // Verify batch updates
  const gu1 = await api.v1.assembly.getGroup({ id: asmId, name: 'RenameBatch1' })
  const gu2 = await api.v1.assembly.getGroup({ id: asmId, name: 'Batch2' })
  console.log('[08] after batch update - RenameBatch1:', JSON.stringify(gu1.result))
  console.log('[08] after batch update - Batch2:', JSON.stringify(gu2.result))

  // Batch getGroup
  const r4 = await api.v1.assembly.getGroup([
    { id: asmId, name: 'RenameBatch1' },
    { id: asmId, name: 'Batch2' },
  ])
  console.log('[08] batch getGroup result:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'batch-get')

  return {}
}
