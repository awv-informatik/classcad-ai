export default async function (api, { snapshot, filewrite }) {
  // Setup
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[08] fastened created:', fId)

  const results = []

  // 1. Invalid constraint ID (999999)
  const e1 = await api.v1.assembly.updateFastened({ id: 999999, xOffset: 100 })
  console.log('[08] invalid ID:', e1.result, 'maxLevel:', e1.maxLevel)
  results.push({ test: 'invalid constraint ID', result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages })

  // 2. Assembly root ID instead of constraint ID
  const e2 = await api.v1.assembly.updateFastened({ id: asmId, xOffset: 100 })
  console.log('[08] assembly root ID:', e2.result, 'maxLevel:', e2.maxLevel)
  results.push({ test: 'assembly root as id', result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages })

  // 3. Instance ID as constraint ID
  const e3 = await api.v1.assembly.updateFastened({ id: inst1, xOffset: 100 })
  console.log('[08] instance ID:', e3.result, 'maxLevel:', e3.maxLevel)
  results.push({ test: 'instance as id', result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages })

  // 4. Invalid mate csys
  const e4 = await api.v1.assembly.updateFastened({ id: fId, mate1: { path: [inst1], csys: 999999 } })
  console.log('[08] invalid csys:', e4.result, 'maxLevel:', e4.maxLevel)
  results.push({ test: 'invalid csys', result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages })

  // 5. Invalid flip string
  const e5 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst2], csys: wcs, flip: 'INVALID' } })
  console.log('[08] invalid flip:', e5.result, 'maxLevel:', e5.maxLevel)
  results.push({ test: 'invalid flip', result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages })

  // 6. Empty object (no changes specified)
  const e6 = await api.v1.assembly.updateFastened({ id: fId })
  console.log('[08] empty update (no params):', e6.result, 'maxLevel:', e6.maxLevel)
  results.push({ test: 'empty update', result: e6.result, maxLevel: e6.maxLevel, messages: e6.messages })

  // 7. Verify constraint still intact after errors
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[08] constraint intact: xOffset=', state?.xOffset)
  results.push({ test: 'constraint intact after errors', xOffset: state?.xOffset })

  filewrite(results, 'error-cases')

  return { fId }
}
