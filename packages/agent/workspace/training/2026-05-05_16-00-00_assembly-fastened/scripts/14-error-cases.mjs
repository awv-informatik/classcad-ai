export default async function (api, { snapshot, filewrite }) {
  // Error cases for fastened
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const results = {}

  // Test 1: missing id
  const r1 = await api.v1.assembly.fastened({
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[14] missing id:', r1.result, 'maxLevel:', r1.maxLevel)
  results.missingId = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }

  // Test 2: missing mate1
  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[14] missing mate1:', r2.result, 'maxLevel:', r2.maxLevel)
  results.missingMate1 = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }

  // Test 3: missing mate2
  const r3 = await api.v1.assembly.fastened({
    id: asmId,
    mate1: { path: [inst1], csys: wcs },
  })
  console.log('[14] missing mate2:', r3.result, 'maxLevel:', r3.maxLevel)
  results.missingMate2 = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }

  // Test 4: self-fastened (same instance for both mates)
  const r4 = await api.v1.assembly.fastened({
    id: asmId,
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst1], csys: wcs },
  })
  console.log('[14] self-fastened:', r4.result, 'maxLevel:', r4.maxLevel)
  results.selfFastened = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }

  // Test 5: invalid csys ID
  const r5 = await api.v1.assembly.fastened({
    id: asmId,
    mate1: { path: [inst1], csys: 999999 },
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[14] invalid csys:', r5.result, 'maxLevel:', r5.maxLevel)
  results.invalidCsys = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }

  // Test 6: invalid flip value
  const r6 = await api.v1.assembly.fastened({
    id: asmId,
    mate1: { path: [inst1], csys: wcs, flip: 'INVALID' },
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[14] invalid flip:', r6.result, 'maxLevel:', r6.maxLevel)
  results.invalidFlip = { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages }

  // Test 7: duplicate constraint name
  await api.v1.assembly.fastened({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
  })
  const r7 = await api.v1.assembly.fastened({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
  })
  console.log('[14] duplicate name:', r7.result, 'maxLevel:', r7.maxLevel)
  results.dupName = { result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages }

  filewrite(results, 'error-cases')

  return {}
}
