export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 60, width: 40, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS1', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 20, height: 20 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS2', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Block' })).result

  const cId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    xOffset: 30,
  })).result

  const errors = []

  // 1. Invalid constraint ID
  const e1 = await api.v1.assembly.updateFastened({ id: 99999, xOffset: 50 })
  console.log('[10] invalid id:', e1.result, 'maxLevel:', e1.maxLevel)
  errors.push({ test: 'invalid_id', result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages })

  // 2. Missing id param entirely
  const e2 = await api.v1.assembly.updateFastened({ xOffset: 50 })
  console.log('[10] missing id:', e2.result, 'maxLevel:', e2.maxLevel)
  errors.push({ test: 'missing_id', result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages })

  // 3. Invalid csys in mate update
  const e3 = await api.v1.assembly.updateFastened({ id: cId, mate1: { csys: 99999 } })
  console.log('[10] invalid csys:', e3.result, 'maxLevel:', e3.maxLevel)
  errors.push({ test: 'invalid_csys', result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages })

  // 4. Invalid flip value
  const e4 = await api.v1.assembly.updateFastened({ id: cId, mate1: { flip: 'INVALID' } })
  console.log('[10] invalid flip:', e4.result, 'maxLevel:', e4.maxLevel)
  errors.push({ test: 'invalid_flip', result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages })

  // 5. Invalid reorient value
  const e5 = await api.v1.assembly.updateFastened({ id: cId, mate1: { reorient: '45' } })
  console.log('[10] invalid reorient:', e5.result, 'maxLevel:', e5.maxLevel)
  errors.push({ test: 'invalid_reorient', result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages })

  // 6. Pass assembly ID instead of constraint ID
  const e6 = await api.v1.assembly.updateFastened({ id: asmId, xOffset: 50 })
  console.log('[10] assembly id:', e6.result, 'maxLevel:', e6.maxLevel)
  errors.push({ test: 'assembly_id_instead', result: e6.result, maxLevel: e6.maxLevel, messages: e6.messages })

  // 7. Verify original constraint is still intact after all errors
  const verify = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[10] verify after errors:', verify.xOffset, '(should still be 30)')

  filewrite(errors, 'error-catalog')
  filewrite(verify, 'verify-after-errors')

  return { cId }
}
