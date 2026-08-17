export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevDeleteFixTest' })).result

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

  // Create revolute
  const c1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'DelTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[11] created:', c1)

  // Verify it exists
  const before = await api.v1.assembly.getRevolute({ id: asmId, name: 'DelTest' })
  console.log('[11] before delete: id=', before.result.id)

  // Delete with CORRECT syntax: ids (plural, array)
  const del = await api.v1.assembly.deleteConstraint({ ids: [c1] })
  console.log('[11] deleteConstraint result:', del.result, 'maxLevel:', del.maxLevel)
  filewrite({ result: del.result, messages: del.messages, maxLevel: del.maxLevel }, 'delete-correct')

  // Check if it's gone
  const after = await api.v1.assembly.getRevolute({ id: asmId, name: 'DelTest' })
  console.log('[11] after delete: result=', after.result, 'maxLevel:', after.maxLevel)
  filewrite({ result: after.result, messages: after.messages, maxLevel: after.maxLevel }, 'after-delete')

  // Recreate with different flip to verify clean state
  const c2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'DelTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: '-Z' },
  })).result
  console.log('[11] recreated:', c2)

  const recheck = await api.v1.assembly.getRevolute({ id: asmId, name: 'DelTest' })
  console.log('[11] recheck: id=', recheck.result.id, 'flip=', recheck.result.mate2.flip)

  // Delete multiple at once
  const c3 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Multi1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[11] multi delete - c2:', c2, 'c3:', c3)

  const delMulti = await api.v1.assembly.deleteConstraint({ ids: [c2, c3] })
  console.log('[11] multi delete result:', delMulti.result, 'maxLevel:', delMulti.maxLevel)

  const check2 = await api.v1.assembly.getRevolute({ id: asmId, name: 'DelTest' })
  const check3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Multi1' })
  console.log('[11] after multi delete - DelTest:', check2.result, 'Multi1:', check3.result)

  return { asmId }
}
