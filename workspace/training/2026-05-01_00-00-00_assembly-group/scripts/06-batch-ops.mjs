export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'I3',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Batch create: array of param objects
  const r1 = await api.v1.assembly.group([
    { id: asmId, name: 'BatchG1', instanceIds: [inst1, inst2] },
    { id: asmId, name: 'BatchG2', instanceIds: [inst2, inst3] },
  ])
  console.log('[06] batch create result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'batch-create')

  // Batch getGroup
  const r2 = await api.v1.assembly.getGroup([
    { id: asmId, name: 'BatchG1' },
    { id: asmId, name: 'BatchG2' },
    { id: asmId, name: 'NonExistent' },
  ])
  console.log('[06] batch getGroup result:', JSON.stringify(r2.result))
  console.log('[06] batch getGroup maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'batch-get')

  // Batch updateGroup
  const g1Id = Array.isArray(r1.result) ? r1.result[0] : r1.result
  const g2Id = Array.isArray(r1.result) ? r1.result[1] : null
  console.log('[06] g1Id:', g1Id, 'g2Id:', g2Id)

  if (g1Id && g2Id) {
    const r3 = await api.v1.assembly.updateGroup([
      { id: g1Id, name: 'RenamedBatch1' },
      { id: g2Id, instanceIds: [inst1, inst2, inst3] },
    ])
    console.log('[06] batch update result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'batch-update')

    // Verify
    const verify1 = (await api.v1.assembly.getGroup({ id: asmId, name: 'RenamedBatch1' })).result
    const verify2 = (await api.v1.assembly.getGroup({ id: asmId, name: 'BatchG2' })).result
    console.log('[06] verify renamed:', JSON.stringify(verify1))
    console.log('[06] verify updated ids:', JSON.stringify(verify2))
  }

  return { asmId }
}
