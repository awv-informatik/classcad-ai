export default async function (api, { snapshot, filewrite }) {
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  const errors = {}

  // Test 1: missing mate2
  try {
    const r1 = await api.v1.assembly.revolute({
      id: asmId, name: 'Bad1',
      mate1: { path: [inst1], csys: wcsA },
    })
    errors.missingMate2 = { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message }
    console.log('[10] missing mate2:', r1.maxLevel, r1.messages?.[0]?.message)
  } catch (e) {
    errors.missingMate2 = { error: e.message }
    console.log('[10] missing mate2 threw:', e.message)
  }

  // Test 2: missing csys in mate
  try {
    const r2 = await api.v1.assembly.revolute({
      id: asmId, name: 'Bad2',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2] },
    })
    errors.missingCsys = { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message }
    console.log('[10] missing csys:', r2.maxLevel, r2.messages?.[0]?.message)
  } catch (e) {
    errors.missingCsys = { error: e.message }
    console.log('[10] missing csys threw:', e.message)
  }

  // Test 3: same instance for both mates
  try {
    const r3 = await api.v1.assembly.revolute({
      id: asmId, name: 'SelfRev',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst1], csys: wcsA },
    })
    errors.sameInstance = { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message }
    console.log('[10] same instance:', r3.maxLevel, r3.result)
  } catch (e) {
    errors.sameInstance = { error: e.message }
    console.log('[10] same instance threw:', e.message)
  }

  // Test 4: invalid flip value
  try {
    const r4 = await api.v1.assembly.revolute({
      id: asmId, name: 'BadFlip',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB, flip: 'Q' },
    })
    errors.invalidFlip = { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message }
    console.log('[10] invalid flip:', r4.maxLevel, r4.messages?.[0]?.message)
  } catch (e) {
    errors.invalidFlip = { error: e.message }
    console.log('[10] invalid flip threw:', e.message)
  }

  // Test 5: duplicate name
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'G', mate1: { path: [inst1], csys: wcsA } })
  await api.v1.assembly.revolute({
    id: asmId, name: 'DupTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  try {
    const r5 = await api.v1.assembly.revolute({
      id: asmId, name: 'DupTest',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB },
    })
    errors.dupName = { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message }
    console.log('[10] dup name:', r5.maxLevel, r5.result)
  } catch (e) {
    errors.dupName = { error: e.message }
    console.log('[10] dup name threw:', e.message)
  }

  // Test 6: getRevolute with wrong name
  const r6 = await api.v1.assembly.getRevolute({ id: asmId, name: 'NonExistent' })
  errors.getWrongName = { result: r6.result, maxLevel: r6.maxLevel, msg: r6.messages?.[0]?.message }
  console.log('[10] getRevolute wrong name: result=', r6.result, 'maxLevel:', r6.maxLevel)

  filewrite(errors, 'error-results')
  return {}
}
