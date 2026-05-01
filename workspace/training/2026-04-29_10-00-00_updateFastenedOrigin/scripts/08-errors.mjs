export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrorTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })).result

  const errors = []

  // Error 1: pass assembly ID instead of constraint ID
  const e1 = await api.v1.assembly.updateFastenedOrigin({ id: asmId, xOffset: 10 })
  errors.push({ test: 'assembly ID instead of constraint ID', result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages })
  console.log('[08] assembly ID — maxLevel:', e1.maxLevel, 'msg:', e1.messages?.[0]?.message)

  // Error 2: nonexistent ID
  const e2 = await api.v1.assembly.updateFastenedOrigin({ id: 99999, xOffset: 10 })
  errors.push({ test: 'nonexistent ID', result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages })
  console.log('[08] nonexistent ID — maxLevel:', e2.maxLevel, 'msg:', e2.messages?.[0]?.message)

  // Error 3: missing id param
  const e3 = await api.v1.assembly.updateFastenedOrigin({ xOffset: 10 })
  errors.push({ test: 'missing id', result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages })
  console.log('[08] missing id — maxLevel:', e3.maxLevel, 'msg:', e3.messages?.[0]?.message)

  // Error 4: invalid flip value
  const e4 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: 'INVALID' } })
  errors.push({ test: 'invalid flip', result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages })
  console.log('[08] invalid flip — maxLevel:', e4.maxLevel, 'msg:', e4.messages?.[0]?.message)

  // Error 5: invalid reorient value
  const e5 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { reorient: '45' } })
  errors.push({ test: 'invalid reorient', result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages })
  console.log('[08] invalid reorient — maxLevel:', e5.maxLevel, 'msg:', e5.messages?.[0]?.message)

  // Error 6: nonexistent csys ID
  const e6 = await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { csys: 99999 } })
  errors.push({ test: 'nonexistent csys', result: e6.result, maxLevel: e6.maxLevel, messages: e6.messages })
  console.log('[08] nonexistent csys — maxLevel:', e6.maxLevel, 'msg:', e6.messages?.[0]?.message)

  // Verify constraint is still intact after errors
  const verify = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[08] constraint still intact after errors?', verify ? '✓' : '❌', 'id:', verify?.id)

  filewrite(errors, 'error-results')

  return {}
}
