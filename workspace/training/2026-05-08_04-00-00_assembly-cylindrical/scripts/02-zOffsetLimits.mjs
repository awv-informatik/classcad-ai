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

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 50], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // COG before
  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[02] inst2 COG before:', cogBefore)

  // Cylindrical with zOffsetLimits (constrain Z translation to range 10..30)
  const cylR = await api.v1.assembly.cylindrical({
    id: asmId,
    name: 'CylLimited',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffsetLimits: { min: 10, max: 30 }
  })
  console.log('[02] cylindrical result:', cylR.result, 'maxLevel:', cylR.maxLevel)
  if (cylR.messages?.length) console.log('[02] messages:', cylR.messages.map(m => m.message))

  // COG after — inst2 was at z=50, limits are 10..30, should it clamp to 30?
  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[02] inst2 COG after:', cogAfter)

  filewrite({ cogBefore, cogAfter, cylId: cylR.result }, 'cog-zOffsetLimits')

  await snapshot('zOffsetLimits')

  // Read back constraint
  const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylLimited' })
  filewrite(getR.result, 'getCylindrical-zOffsetLimits')

  return { asmId }
}
