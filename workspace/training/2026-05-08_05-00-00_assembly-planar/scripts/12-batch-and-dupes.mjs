export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'B1' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'B2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Batch creation
  const rBatch = await api.v1.assembly.planar([
    { id: asmId, name: 'Planar1', mate1: { path: [inst1], csys: wcsA }, mate2: { path: [inst2], csys: wcsB }, zOffset: 10 },
    { id: asmId, name: 'Planar1', mate1: { path: [inst1], csys: wcsA }, mate2: { path: [inst3], csys: wcsB }, zOffset: 20 },
  ])
  console.log('[12] batch result:', JSON.stringify(rBatch.result), 'maxLevel:', rBatch.maxLevel)
  console.log('[12] duplicate names: both named Planar1')

  // Verify getPlanar finds the first one
  const get = await api.v1.assembly.getPlanar({ id: asmId, name: 'Planar1' })
  console.log('[12] getPlanar "Planar1" result.id:', get.result?.id, '(should be first constraint)')

  filewrite({
    batch: { result: rBatch.result, messages: rBatch.messages, maxLevel: rBatch.maxLevel },
    getPlanar: { result: get.result, maxLevel: get.maxLevel },
  }, 'batch-dupes')

  return {}
}
