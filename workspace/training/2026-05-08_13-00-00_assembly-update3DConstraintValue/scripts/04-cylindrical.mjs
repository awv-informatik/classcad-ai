// Test update3DConstraintValue on cylindrical constraint (DOFs: Z_OFFSET + Z_ROTATION)
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Piston' })).result
  await api.v1.part.box({ id: tplB, name: 'B', length: 20, width: 20, height: 40 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Piston',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cylId = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Slide',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[04] cylindrical ID:', cylId)

  const mp0 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] INITIAL COG:', mp0.cog)

  await snapshot('before')

  // DOF 1: Z_OFFSET (translation along Z axis)
  const r1 = await api.v1.assembly.update3DConstraintValue({
    id: cylId, name: 'Z_OFFSET', value: 50,
  })
  console.log('[04] Z_OFFSET result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  const mp1 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] AFTER Z_OFFSET COG:', mp1.cog)

  await snapshot('after-zoffset')

  // DOF 2: Z_ROTATION (rotation around Z axis)
  const r2 = await api.v1.assembly.update3DConstraintValue({
    id: cylId, name: 'Z_ROTATION', value: 0.7854,  // 45 degrees
  })
  console.log('[04] Z_ROTATION result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  const mp2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] AFTER Z_ROTATION COG:', mp2.cog)

  await snapshot('after-zrot')

  // Non-DOF: X_OFFSET should be no-op on cylindrical
  const r3 = await api.v1.assembly.update3DConstraintValue({
    id: cylId, name: 'X_OFFSET', value: 30,
  })
  console.log('[04] X_OFFSET result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  const mp3 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] AFTER X_OFFSET COG:', mp3.cog)

  filewrite({
    initial: mp0.cog, afterZOff: mp1.cog, afterZRot: mp2.cog, afterXOff: mp3.cog,
    r1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    r2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    r3: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'results')

  return { cylId }
}
