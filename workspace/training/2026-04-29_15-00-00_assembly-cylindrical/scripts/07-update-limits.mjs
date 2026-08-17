export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylUpdateAsm' })).result

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

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Create with no limits
  const cId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'UpdateTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[07] created:', cId)

  // Get baseline
  const g0 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] baseline offLimits:', JSON.stringify(g0.zOffsetLimits), 'rotLimits:', JSON.stringify(g0.zRotationLimits))

  // Update: add zOffsetLimits
  const u1 = await api.v1.assembly.updateCylindrical({ id: cId, zOffsetLimits: { min: -20, max: 40 } })
  console.log('[07] add offset limits:', u1.result, 'maxLevel:', u1.maxLevel)
  const g1 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after add offset:', JSON.stringify(g1.zOffsetLimits))

  // Update: add zRotationLimits
  const u2 = await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: { min: '-45deg', max: '90deg' } })
  console.log('[07] add rotation limits:', u2.result, 'maxLevel:', u2.maxLevel)
  const g2 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after add rotation:', JSON.stringify(g2.zRotationLimits))
  console.log('[07] offset still there:', JSON.stringify(g2.zOffsetLimits))

  // Update: partial zRotationLimits (max only) — does update allow partial like revolute?
  const u3 = await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: { max: '180deg' } })
  console.log('[07] partial rotation (max only):', u3.result, 'maxLevel:', u3.maxLevel)
  const g3 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after partial rotation:', JSON.stringify(g3.zRotationLimits))

  // Update: partial zOffsetLimits (min only)
  const u4 = await api.v1.assembly.updateCylindrical({ id: cId, zOffsetLimits: { min: -50 } })
  console.log('[07] partial offset (min only):', u4.result, 'maxLevel:', u4.maxLevel)
  const g4 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after partial offset:', JSON.stringify(g4.zOffsetLimits))

  // Update: remove zRotationLimits with null
  const u5 = await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: null })
  console.log('[07] remove rotation:', u5.result, 'maxLevel:', u5.maxLevel)
  const g5 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after remove rotation:', JSON.stringify(g5.zRotationLimits))

  // Update: remove zOffsetLimits with null
  const u6 = await api.v1.assembly.updateCylindrical({ id: cId, zOffsetLimits: null })
  console.log('[07] remove offset:', u6.result, 'maxLevel:', u6.maxLevel)
  const g6 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after remove offset:', JSON.stringify(g6.zOffsetLimits))

  // Update: remove just one limit from zRotationLimits
  await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: { min: '-30deg', max: '60deg' } })
  const u7 = await api.v1.assembly.updateCylindrical({ id: cId, zRotationLimits: { min: null } })
  console.log('[07] remove min only:', u7.result, 'maxLevel:', u7.maxLevel)
  const g7 = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'UpdateTest' })).result
  console.log('[07] after remove min:', JSON.stringify(g7.zRotationLimits))

  filewrite({
    baseline: { zOffsetLimits: g0.zOffsetLimits, zRotationLimits: g0.zRotationLimits },
    afterAddOffset: g1.zOffsetLimits,
    afterAddRotation: { offset: g2.zOffsetLimits, rotation: g2.zRotationLimits },
    afterPartialRotation: g3.zRotationLimits,
    afterPartialOffset: g4.zOffsetLimits,
    afterRemoveRotation: g5.zRotationLimits,
    afterRemoveOffset: g6.zOffsetLimits,
    afterRemoveMin: g7.zRotationLimits,
  }, 'update-limits-progression')

  await snapshot('update-limits')

  return { asmId, cId }
}
