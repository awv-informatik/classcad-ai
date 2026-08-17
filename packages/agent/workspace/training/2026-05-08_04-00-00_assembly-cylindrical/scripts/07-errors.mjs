export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test 1: missing mate2
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'NoMate2',
    mate1: { path: [inst1], csys: wcsA }
  })
  console.log('[07] missing mate2:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) r1.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  // Test 2: missing csys in mate
  const r2 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'NoCsys',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2] }
  })
  console.log('[07] missing csys:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) r2.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  // Test 3: invalid flip
  const r3 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'BadFlip',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, flip: 'Q' }
  })
  console.log('[07] invalid flip:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) r3.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  // Test 4: invalid reorient
  const r4 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'BadReorient',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, reorient: '45' }
  })
  console.log('[07] invalid reorient:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) r4.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  // Test 5: missing id (assembly)
  const r5 = await api.v1.assembly.cylindrical({
    name: 'NoId',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[07] missing id:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) r5.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  // Test 6: duplicate name (should succeed silently like revolute)
  const r6a = await api.v1.assembly.cylindrical({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  const r6b = await api.v1.assembly.cylindrical({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[07] dup name 1:', r6a.result, 'maxLevel:', r6a.maxLevel)
  console.log('[07] dup name 2:', r6b.result, 'maxLevel:', r6b.maxLevel)

  // Test 7: same instance for both mates
  const r7 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'SameMate',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst1], csys: wcsA }
  })
  console.log('[07] same instance both mates:', r7.result, 'maxLevel:', r7.maxLevel)
  if (r7.messages?.length) r7.messages.forEach(m => console.log('[07]   msg:', m.level, m.code, m.message))

  filewrite({
    missingMate2: { result: r1.result, maxLevel: r1.maxLevel },
    missingCsys: { result: r2.result, maxLevel: r2.maxLevel },
    invalidFlip: { result: r3.result, maxLevel: r3.maxLevel },
    invalidReorient: { result: r4.result, maxLevel: r4.maxLevel },
    missingId: { result: r5.result, maxLevel: r5.maxLevel },
    dupName: { result1: r6a.result, result2: r6b.result },
    sameInstance: { result: r7.result, maxLevel: r7.maxLevel }
  }, 'error-cases')

  return { asmId }
}
