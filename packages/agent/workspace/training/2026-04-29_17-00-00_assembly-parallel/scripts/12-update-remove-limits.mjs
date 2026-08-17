export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParRemLim' })).result

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

  // Create with limits
  const cId = (await api.v1.assembly.parallel({
    id: asmId,
    name: 'RemoveLim',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffsetLimits: { min: -10, max: 10 },
    zRotationLimits: { min: 0, max: 1.5708 },
  })).result

  const g1 = await api.v1.assembly.getParallel({ id: asmId, name: 'RemoveLim' })
  console.log('[12] before remove - xOff:', JSON.stringify(g1.result.xOffsetLimits))
  console.log('[12] before remove - zRot:', JSON.stringify(g1.result.zRotationLimits))

  // Try to remove limits by passing VOID
  const u = await api.v1.assembly.updateParallel({
    id: cId,
    xOffsetLimits: 'VOID',
    zRotationLimits: 'VOID',
  })
  console.log('[12] remove limits result:', u.result, 'maxLevel:', u.maxLevel)
  filewrite({ result: u.result, messages: u.messages, maxLevel: u.maxLevel }, 'remove-limits')

  const g2 = await api.v1.assembly.getParallel({ id: asmId, name: 'RemoveLim' })
  console.log('[12] after remove - xOff:', JSON.stringify(g2.result.xOffsetLimits))
  console.log('[12] after remove - zRot:', JSON.stringify(g2.result.zRotationLimits))
  filewrite(g2.result, 'after-remove-verified')

  return { constraintId: cId }
}
