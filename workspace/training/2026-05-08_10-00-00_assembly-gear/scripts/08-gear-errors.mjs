export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instBase = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const instArm1 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const instArm2 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [instBase], csys: wcsA } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm1], csys: wcsB },
    zOffset: 15,
  })).result

  // Test 1: non-existent constraint ID
  const e1 = await api.v1.assembly.gear({
    id: asmId, name: 'Bad1',
    constr1Id: rev1, constr2Id: 999999,
    ratio: 1.0,
  })
  console.log('[08] nonexistent constr2:', e1.result, 'maxLevel:', e1.maxLevel)

  // Test 2: pass instance ID as constr1Id
  const e2 = await api.v1.assembly.gear({
    id: asmId, name: 'Bad2',
    constr1Id: instArm1, constr2Id: rev1,
    ratio: 1.0,
  })
  console.log('[08] instance as constr1:', e2.result, 'maxLevel:', e2.maxLevel)

  // Test 3: same constraint for both
  const e3 = await api.v1.assembly.gear({
    id: asmId, name: 'Bad3',
    constr1Id: rev1, constr2Id: rev1,
    ratio: 1.0,
  })
  console.log('[08] same constraint:', e3.result, 'maxLevel:', e3.maxLevel)

  // Test 4: gear on fastenedOrigin (no rotation DOF)
  const fo = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO2',
    mate1: { path: [instArm2], csys: wcsC },
  })).result
  const e4 = await api.v1.assembly.gear({
    id: asmId, name: 'Bad4',
    constr1Id: rev1, constr2Id: fo,
    ratio: 1.0,
  })
  console.log('[08] gear on fastenedOrigin:', e4.result, 'maxLevel:', e4.maxLevel)

  // Test 5: missing required param (no constr1Id)
  const e5 = await api.v1.assembly.gear({
    id: asmId, name: 'Bad5',
    constr2Id: rev1,
    ratio: 1.0,
  })
  console.log('[08] missing constr1Id:', e5.result, 'maxLevel:', e5.maxLevel)

  filewrite({
    nonexistent: { result: e1.result, messages: e1.messages, maxLevel: e1.maxLevel },
    instanceAsConstr: { result: e2.result, messages: e2.messages, maxLevel: e2.maxLevel },
    sameConstraint: { result: e3.result, messages: e3.messages, maxLevel: e3.maxLevel },
    fastenedOrigin: { result: e4.result, messages: e4.messages, maxLevel: e4.maxLevel },
    missingConstr1: { result: e5.result, messages: e5.messages, maxLevel: e5.maxLevel },
  }, 'error-data')

  return { asmId }
}
