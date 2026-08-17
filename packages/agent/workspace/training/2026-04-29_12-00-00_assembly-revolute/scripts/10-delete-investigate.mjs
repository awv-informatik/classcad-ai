export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevDeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Create a revolute constraint
  const c1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'TestDel',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[10] created revolute:', c1)

  // Verify it exists
  const before = await api.v1.assembly.getRevolute({ id: asmId, name: 'TestDel' })
  console.log('[10] before delete - found:', before.result ? before.result.id : 'NOT FOUND')

  // Delete using the constraint ID
  const del = await api.v1.assembly.deleteConstraint({ id: c1 })
  console.log('[10] deleteConstraint result:', del.result, 'maxLevel:', del.maxLevel)
  filewrite({ result: del.result, messages: del.messages, maxLevel: del.maxLevel }, 'delete-response')

  // Check if it still exists after delete
  const after = await api.v1.assembly.getRevolute({ id: asmId, name: 'TestDel' })
  console.log('[10] after delete - found:', after.result ? after.result.id : 'NOT FOUND')
  console.log('[10] after delete maxLevel:', after.maxLevel)
  filewrite({ result: after.result, messages: after.messages, maxLevel: after.maxLevel }, 'after-delete')

  // Create a new one with same name
  const c2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'TestDel',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z' },
  })).result
  console.log('[10] recreated revolute:', c2)

  // Verify the new one has the right flip
  const recheck = await api.v1.assembly.getRevolute({ id: asmId, name: 'TestDel' })
  console.log('[10] recheck: id=', recheck.result.id, 'flip=', recheck.result.mate2.flip)
  filewrite(recheck.result, 'recheck-after-recreate')

  return { asmId }
}
