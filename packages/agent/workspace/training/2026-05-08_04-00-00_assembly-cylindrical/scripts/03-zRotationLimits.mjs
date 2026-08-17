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
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[03] inst2 COG before:', cogBefore)

  // Cylindrical with both limits
  const cylR = await api.v1.assembly.cylindrical({
    id: asmId,
    name: 'CylBothLimits',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffsetLimits: { min: 15, max: 25 },
    zRotationLimits: { min: 0, max: 1.5708 }
  })
  console.log('[03] cylindrical result:', cylR.result, 'maxLevel:', cylR.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  console.log('[03] inst2 COG after:', cogAfter)

  filewrite({ cogBefore, cogAfter }, 'cog-bothLimits')

  await snapshot('bothLimits')

  // Test with degree strings
  const asmId2 = (await api.v1.assembly.create({})).result
  const tplC = (await api.v1.assembly.partTemplate({ name: 'Base2' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplD = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplD, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsD = (await api.v1.part.workCSys({
    id: tplD, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId2 })

  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId2, name: 'Base2' })).result
  const inst4 = (await api.v1.assembly.instance({
    productId: tplD, ownerId: asmId2, name: 'Arm2',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId2, name: 'Ground2',
    mate1: { path: [inst3], csys: wcsC }
  })

  // Degree strings for rotation limits
  const cylR2 = await api.v1.assembly.cylindrical({
    id: asmId2,
    name: 'CylDeg',
    mate1: { path: [inst3], csys: wcsC },
    mate2: { path: [inst4], csys: wcsD },
    zRotationLimits: { min: '-45deg', max: '90deg' }
  })
  console.log('[03] degree strings result:', cylR2.result, 'maxLevel:', cylR2.maxLevel)

  const getR = await api.v1.assembly.getCylindrical({ id: asmId2, name: 'CylDeg' })
  console.log('[03] getCylindrical zRotationLimits:', getR.result?.zRotationLimits)
  filewrite(getR.result, 'getCylindrical-degStrings')

  return { asmId }
}
