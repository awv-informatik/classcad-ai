export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'A',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'C',
  })).result

  await snapshot('before-all-at-origin')

  // Batch transform — array of objects
  const r = await api.v1.assembly.transformInstanceTo([
    { id: inst1, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { id: inst2, transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] },
    { id: inst3, transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] },
  ])
  console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  const cog = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG after batch:', JSON.stringify(cog?.cog))
  // Expected: 3 blocks at [0,0,0], [50,0,0], [100,0,0]
  // COG.x = (15 + 65 + 115) / 3 = 65
  // COG.y = 10, COG.z = 7.5

  await snapshot('after-batch')

  filewrite({ cog: cog?.cog, volume: cog?.volume }, 'batch-cog')
  return { asmId }
}
