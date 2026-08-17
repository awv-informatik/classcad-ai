export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RemoveLimitsAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, length: 30, width: 30, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  // Create with limits
  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'LimTest',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-90deg', max: '90deg' },
  })).result
  console.log('[03] created with limits:', cId)

  const before = (await api.v1.assembly.getRevolute({ id: asmId, name: 'LimTest' })).result
  console.log('[03] limits before:', JSON.stringify(before.zRotationLimits))

  // Remove limits with null
  const r1 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: null })
  console.log('[03] remove with null:', r1.result, 'maxLevel:', r1.maxLevel)

  const afterNull = (await api.v1.assembly.getRevolute({ id: asmId, name: 'LimTest' })).result
  console.log('[03] limits after null:', JSON.stringify(afterNull.zRotationLimits))
  filewrite(afterNull, 'after-null-remove')

  // Re-add limits
  await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: '-45deg', max: '120deg' } })
  const reAdded = (await api.v1.assembly.getRevolute({ id: asmId, name: 'LimTest' })).result
  console.log('[03] limits re-added:', JSON.stringify(reAdded.zRotationLimits))

  // Try removing with VOID (undefined)
  const r2 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: undefined })
  console.log('[03] remove with undefined:', r2.result, 'maxLevel:', r2.maxLevel)

  const afterUndef = (await api.v1.assembly.getRevolute({ id: asmId, name: 'LimTest' })).result
  console.log('[03] limits after undefined:', JSON.stringify(afterUndef.zRotationLimits))

  // Try setting limits back and removing with empty object
  await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: '-30deg', max: '30deg' } })
  const r3 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: {} })
  console.log('[03] empty object:', r3.result, 'maxLevel:', r3.maxLevel)

  const afterEmpty = (await api.v1.assembly.getRevolute({ id: asmId, name: 'LimTest' })).result
  console.log('[03] limits after empty object:', JSON.stringify(afterEmpty.zRotationLimits))
  filewrite(afterEmpty, 'after-empty-object')

  return { cId }
}
