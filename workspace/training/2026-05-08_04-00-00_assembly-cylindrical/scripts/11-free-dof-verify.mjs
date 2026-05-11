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
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test: does cylindrical accept a zOffset param? (revolute has it, cylindrical shouldn't)
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  const r1 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylWithZOffset',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 25
  })
  console.log('[11] cylindrical with zOffset param:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) r1.messages.forEach(m => console.log('[11]   msg:', m.message))

  // Check if zOffset was silently ignored
  if (r1.result) {
    const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylWithZOffset' })
    console.log('[11] getCylindrical result keys:', Object.keys(getR.result || {}))
    console.log('[11] has zOffset?', 'zOffset' in (getR.result || {}))
    console.log('[11] zOffsetLimits:', getR.result?.zOffsetLimits)
    filewrite(getR.result, 'getCylindrical-withZOffset')

    const cog = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
    console.log('[11] COG after (inst2 started z=20):', cog)
  }

  // Test: no limits at all — inst2 should stay at its initial z-offset
  await api.v1.assembly.deleteConstraint({ id: r1.result })
  await api.v1.assembly.deleteInstance({ id: inst2 })

  const inst3 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'FreeArm',
    transformation: [[0, 0, 35], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylFree',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsB }
  })

  const cogFree = (await api.v1.part.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[11] free DOF inst3 (started z=35): COG =', cogFree)
  console.log('[11] z-offset preserved?', Math.abs(cogFree.z - 39) < 0.1 ? 'YES (35+4)' : 'NO')

  await snapshot('free-dof')

  return { asmId }
}
