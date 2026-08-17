export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParNullTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref1', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Mover' })).result
  await api.v1.part.box({ id: tpl2, name: 'Block', length: 30, width: 30, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref2', origin: [15, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'MoverInst' })).result

  // Create with all limits set
  const cId = (await api.v1.assembly.parallel({
    id: asmId,
    name: 'NullTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: { min: -10, max: 10 },
    yOffsetLimits: { min: -5, max: 5 },
    zOffsetLimits: { min: 0, max: 20 },
    zRotationLimits: { min: 0, max: 1.5708 },
  })).result

  // Verify initial state
  const g0 = await api.v1.assembly.getParallel({ id: asmId, name: 'NullTest' })
  console.log('[14] initial xOff:', JSON.stringify(g0.result.xOffsetLimits))
  console.log('[14] initial yOff:', JSON.stringify(g0.result.yOffsetLimits))

  // Test: pass null for xOffsetLimits only, leave yOffsetLimits untouched
  const u1 = await api.v1.assembly.updateParallel({
    id: cId,
    xOffsetLimits: null,
  })
  console.log('[14] null update result:', u1.result, 'maxLevel:', u1.maxLevel)

  const g1 = await api.v1.assembly.getParallel({ id: asmId, name: 'NullTest' })
  console.log('[14] after null - xOff:', JSON.stringify(g1.result.xOffsetLimits))
  console.log('[14] after null - yOff:', JSON.stringify(g1.result.yOffsetLimits))
  console.log('[14] after null - zOff:', JSON.stringify(g1.result.zOffsetLimits))
  console.log('[14] after null - zRot:', JSON.stringify(g1.result.zRotationLimits))
  filewrite(g1.result, 'after-null-update')

  return {}
}
