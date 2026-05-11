// Test update3DConstraintValue Z_ROTATION on a revolute constraint
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base plate
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Template B: arm
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 80, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Create revolute between inst1 and inst2
  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
  })).result
  console.log('[03] revolute ID:', revId)

  // Measure initial COG
  const mp0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] INITIAL inst2 COG:', mp0.cog)

  await snapshot('before')

  // Try Z_ROTATION to rotate the arm 90 degrees
  const r1 = await api.v1.assembly.update3DConstraintValue({
    id: revId, name: 'Z_ROTATION', value: 1.5708,
  })
  console.log('[03] Z_ROTATION result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] AFTER Z_ROTATION COG:', mp1.cog)

  await snapshot('after-zrot')

  // Also try Z_OFFSET on revolute
  const r2 = await api.v1.assembly.update3DConstraintValue({
    id: revId, name: 'Z_OFFSET', value: 30,
  })
  console.log('[03] Z_OFFSET result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[03] AFTER Z_OFFSET COG:', mp2.cog)

  // Try X_OFFSET on revolute (revolute doesn't natively support X offset)
  const r3 = await api.v1.assembly.update3DConstraintValue({
    id: revId, name: 'X_OFFSET', value: 50,
  })
  console.log('[03] X_OFFSET result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Check getRevolute state
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[03] getRevolute:', JSON.stringify(state))
  filewrite(state, 'revolute-state')

  filewrite({
    initial: mp0.cog,
    afterZRot: mp1.cog,
    afterZOff: mp2.cog,
    r1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    r2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    r3: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'results')

  await snapshot('final')
  return { revId }
}
