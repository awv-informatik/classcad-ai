export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylBatchUpd' })).result

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

  const c1 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const c2 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl2',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result

  console.log('[09] created:', c1, c2)

  // Batch update
  const u = await api.v1.assembly.updateCylindrical([
    { id: c1, zOffsetLimits: { min: -10, max: 10 }, name: 'Cyl1_Updated' },
    { id: c2, zRotationLimits: { min: '-60deg', max: '60deg' }, name: 'Cyl2_Updated' },
  ])
  console.log('[09] batch update result:', u.result, 'maxLevel:', u.maxLevel)
  console.log('[09] batch result type:', Array.isArray(u.result) ? 'array' : typeof u.result)

  const g1 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl1_Updated' })).result
  const g2 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'Cyl2_Updated' })).result
  console.log('[09] Cyl1 after batch:', JSON.stringify(g1?.zOffsetLimits))
  console.log('[09] Cyl2 after batch:', JSON.stringify(g2?.zRotationLimits))

  filewrite({
    batchUpdate: { result: u.result, maxLevel: u.maxLevel },
    cyl1: g1,
    cyl2: g2,
  }, 'batch-update')

  return { asmId }
}
