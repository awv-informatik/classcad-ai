export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, length: 50, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, length: 30, width: 30, height: 30 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'W', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  const cId = (await api.v1.assembly.revolute({
    id: asmId, name: 'ErrRev',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[06] created:', cId)

  const errors = {}

  // 1. Assembly ID instead of constraint ID
  const r1 = await api.v1.assembly.updateRevolute({ id: asmId, name: 'NewName' })
  errors.asmIdInstead = { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message, code: r1.messages?.[0]?.code }
  console.log('[06] assembly ID:', r1.result, r1.maxLevel, r1.messages?.[0]?.message)

  // 2. Nonexistent constraint ID
  const r2 = await api.v1.assembly.updateRevolute({ id: 99999, name: 'NewName' })
  errors.nonexistentId = { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message, code: r2.messages?.[0]?.code }
  console.log('[06] nonexistent ID:', r2.result, r2.maxLevel, r2.messages?.[0]?.message)

  // 3. Missing id entirely
  const r3 = await api.v1.assembly.updateRevolute({ name: 'NewName' })
  errors.missingId = { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message, code: r3.messages?.[0]?.code }
  console.log('[06] missing id:', r3.result, r3.maxLevel, r3.messages?.[0]?.message)

  // 4. Invalid flip value
  const r4 = await api.v1.assembly.updateRevolute({ id: cId, mate1: { flip: 'INVALID' } })
  errors.invalidFlip = { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message, code: r4.messages?.[0]?.code }
  console.log('[06] invalid flip:', r4.result, r4.maxLevel, r4.messages?.[0]?.message)

  // 5. Invalid reorient value
  const r5 = await api.v1.assembly.updateRevolute({ id: cId, mate2: { reorient: '45' } })
  errors.invalidReorient = { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message, code: r5.messages?.[0]?.code }
  console.log('[06] invalid reorient:', r5.result, r5.maxLevel, r5.messages?.[0]?.message)

  // 6. Partial zRotationLimits (only min)
  const r6 = await api.v1.assembly.updateRevolute({ id: cId, zRotationLimits: { min: '-90deg' } })
  errors.partialLimits = { result: r6.result, maxLevel: r6.maxLevel, msg: r6.messages?.[0]?.message, code: r6.messages?.[0]?.code }
  console.log('[06] partial limits:', r6.result, r6.maxLevel, r6.messages?.[0]?.message)

  // 7. Invalid csys ID
  const r7 = await api.v1.assembly.updateRevolute({ id: cId, mate1: { csys: 99999 } })
  errors.invalidCsys = { result: r7.result, maxLevel: r7.maxLevel, msg: r7.messages?.[0]?.message, code: r7.messages?.[0]?.code }
  console.log('[06] invalid csys:', r7.result, r7.maxLevel, r7.messages?.[0]?.message)

  // Verify constraint is still intact after all failed updates
  const afterErrors = (await api.v1.assembly.getRevolute({ id: asmId, name: 'ErrRev' })).result
  console.log('[06] constraint survived:', afterErrors?.name === 'ErrRev' ? '✓' : '❌')
  console.log('[06] all fields intact:', afterErrors?.mate1?.flip, afterErrors?.mate2?.flip, afterErrors?.zOffset)

  filewrite(errors, 'error-catalog')
  filewrite(afterErrors, 'after-errors')

  return { cId }
}
