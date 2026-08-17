export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarBatch' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: tpl3, name: 'Cube', length: 20, width: 20, height: 20 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Ref', origin: [10, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId })).result

  // Batch create planar constraints
  const r = await api.v1.assembly.planar([
    {
      id: asmId,
      name: 'Batch1',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2 },
      zOffset: 10,
    },
    {
      id: asmId,
      name: 'Batch2',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst3], csys: wcs3 },
      zOffset: 20,
    },
  ])

  console.log('[09] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] is array:', Array.isArray(r.result))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('batch-planar')
  return { batchIds: r.result }
}
