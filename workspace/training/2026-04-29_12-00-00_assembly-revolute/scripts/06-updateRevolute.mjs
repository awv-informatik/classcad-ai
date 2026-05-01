export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevUpdateTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 70 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [5, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Create basic revolute
  const cId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[06] created revolute:', cId)
  await snapshot('initial')

  // Update 1: change name
  const u1 = await api.v1.assembly.updateRevolute({ id: cId, name: 'UpdatedHinge' })
  console.log('[06] update name: result=', u1.result, 'maxLevel=', u1.maxLevel)
  filewrite({ result: u1.result, messages: u1.messages, maxLevel: u1.maxLevel }, 'update-name')

  // Verify name changed via getRevolute
  const g1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'UpdatedHinge' })
  console.log('[06] getName after rename:', g1.result ? g1.result.name : 'NOT FOUND')

  // Update 2: change zOffset
  const u2 = await api.v1.assembly.updateRevolute({ id: cId, zOffset: 25 })
  console.log('[06] update zOffset: result=', u2.result, 'maxLevel=', u2.maxLevel)
  await snapshot('after-zOffset')

  // Verify
  const g2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'UpdatedHinge' })
  console.log('[06] zOffset after update:', g2.result.zOffset)

  // Update 3: add rotation limits
  const u3 = await api.v1.assembly.updateRevolute({
    id: cId,
    zRotationLimits: { min: '-180deg', max: '270deg' },
  })
  console.log('[06] update limits: result=', u3.result, 'maxLevel=', u3.maxLevel)

  const g3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'UpdatedHinge' })
  filewrite(g3.result, 'after-all-updates')
  console.log('[06] limits after update:', JSON.stringify(g3.result.zRotationLimits))

  // Update 4: change flip on mate2
  const u4 = await api.v1.assembly.updateRevolute({ id: cId, mate2: { flip: '-Z' } })
  console.log('[06] update mate2 flip: result=', u4.result, 'maxLevel=', u4.maxLevel)
  await snapshot('after-flip-update')

  const g4 = await api.v1.assembly.getRevolute({ id: asmId, name: 'UpdatedHinge' })
  filewrite(g4.result, 'after-flip-update')
  console.log('[06] mate2 flip after update:', g4.result.mate2.flip)

  // Update 5: remove rotation limits (set to VOID/null)
  const u5 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: null })
  console.log('[06] remove limits: result=', u5.result, 'maxLevel=', u5.maxLevel)

  const g5 = await api.v1.assembly.getRevolute({ id: asmId, name: 'UpdatedHinge' })
  console.log('[06] limits after removal:', JSON.stringify(g5.result.zRotationLimits))
  filewrite(g5.result, 'after-limits-removed')

  return { asmId, cId }
}
