export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ParUpd' })).result

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

  // Create with no limits
  const cId = (await api.v1.assembly.parallel({
    id: asmId,
    name: 'UpdTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  console.log('[08] created:', cId)
  await snapshot('before-update')

  // Update: add limits and change name
  const u = await api.v1.assembly.updateParallel({
    id: cId,
    name: 'UpdTestRenamed',
    xOffsetLimits: { min: -10, max: 10 },
    zRotationLimits: { min: '0deg', max: '45deg' },
  })
  console.log('[08] update result:', u.result, 'maxLevel:', u.maxLevel)
  filewrite({ result: u.result, messages: u.messages, maxLevel: u.maxLevel }, 'update-response')

  // Verify the update via get
  const g = await api.v1.assembly.getParallel({ id: asmId, name: 'UpdTestRenamed' })
  console.log('[08] after update name:', g.result.name)
  console.log('[08] after update xOffsetLimits:', JSON.stringify(g.result.xOffsetLimits))
  console.log('[08] after update zRotationLimits:', JSON.stringify(g.result.zRotationLimits))
  filewrite(g.result, 'update-verified')

  await snapshot('after-update')

  // Update mate flip
  const u2 = await api.v1.assembly.updateParallel({
    id: cId,
    mate1: { flip: 'X' },
    mate2: { flip: '-Y', reorient: '90' },
  })
  console.log('[08] update flip result:', u2.result, 'maxLevel:', u2.maxLevel)

  const g2 = await api.v1.assembly.getParallel({ id: asmId, name: 'UpdTestRenamed' })
  console.log('[08] after flip update mate1.flip:', g2.result.mate1.flip, 'mate2.flip:', g2.result.mate2.flip)
  filewrite(g2.result, 'update-flip-verified')

  await snapshot('after-flip-update')
  return { constraintId: cId }
}
