export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Alpha' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Beta',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Gamma',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[01] created instances:', inst1, inst2, inst3)

  // Get all instances (no name filter)
  const rAll = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[01] getAll result:', JSON.stringify(rAll.result))
  console.log('[01] getAll maxLevel:', rAll.maxLevel)
  console.log('[01] getAll typeof result:', typeof rAll.result, Array.isArray(rAll.result))

  // Get by name
  const rByName = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Beta' })
  console.log('[01] byName("Beta") result:', rByName.result)
  console.log('[01] byName("Beta") typeof:', typeof rByName.result)
  console.log('[01] byName("Beta") maxLevel:', rByName.maxLevel)

  filewrite({
    createdIds: { inst1, inst2, inst3 },
    getAll: { result: rAll.result, maxLevel: rAll.maxLevel, messages: rAll.messages },
    getByName: { result: rByName.result, maxLevel: rByName.maxLevel, messages: rByName.messages },
  }, 'basic-results')

  await snapshot('all-instances')
  return { asmId, tplId }
}
