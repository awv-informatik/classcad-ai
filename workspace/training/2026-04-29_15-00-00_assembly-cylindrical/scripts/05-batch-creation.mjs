export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylBatchAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl3, name: 'Arm', length: 15, width: 15, height: 40 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Axis3', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'ArmInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Batch creation — array of constraint params
  const r = await api.v1.assembly.cylindrical([
    {
      id: asmId, name: 'BatchCyl1',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2 },
      zOffsetLimits: { min: -10, max: 10 },
    },
    {
      id: asmId, name: 'BatchCyl2',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst3], csys: wcs3 },
      zRotationLimits: { min: '-90deg', max: '90deg' },
    },
  ])

  console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] batch result type:', Array.isArray(r.result) ? 'array' : typeof r.result)
  console.log('[05] batch result length:', Array.isArray(r.result) ? r.result.length : 'N/A')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  // Verify both were created
  const g1 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'BatchCyl1' })
  const g2 = await api.v1.assembly.getCylindrical({ id: asmId, name: 'BatchCyl2' })
  console.log('[05] batch get 1:', g1.result?.id, 'offset:', JSON.stringify(g1.result?.zOffsetLimits))
  console.log('[05] batch get 2:', g2.result?.id, 'rotation:', JSON.stringify(g2.result?.zRotationLimits))
  filewrite({ cyl1: g1.result, cyl2: g2.result }, 'batch-get')

  await snapshot('batch')

  return { asmId }
}
