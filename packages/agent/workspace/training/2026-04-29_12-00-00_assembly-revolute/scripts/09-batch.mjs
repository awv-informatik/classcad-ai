export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevBatchTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2a = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS_A', origin: [0, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcs2b = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS_B', origin: [15, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'Arm1',
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'Arm2',
  })).result

  // Batch create 2 revolute constraints at once
  const r = await api.v1.assembly.revolute([
    {
      id: asmId,
      name: 'BatchRev1',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2a },
    },
    {
      id: asmId,
      name: 'BatchRev2',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst3], csys: wcs2b },
      zOffset: 20,
    },
  ])
  console.log('[09] batch result:', JSON.stringify(r.result))
  console.log('[09] batch maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  // Verify both constraints exist
  const g1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchRev1' })
  const g2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchRev2' })
  console.log('[09] BatchRev1 found:', g1.result ? g1.result.id : 'NOT FOUND')
  console.log('[09] BatchRev2 found:', g2.result ? g2.result.id : 'NOT FOUND')
  filewrite({ rev1: g1.result, rev2: g2.result }, 'batch-get-both')

  await snapshot('batch')

  return { asmId }
}
