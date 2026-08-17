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

  // Test 1: degree strings for zRotationLimits
  const r1 = await api.v1.assembly.cylindrical({
    id: asmId,
    name: 'CylDeg',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: '-45deg', max: '90deg' }
  })
  console.log('[04] deg strings result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    r1.messages.forEach(m => console.log('[04] msg:', m.level, m.message))
  }

  // If that failed, try with radians and add degree strings on update
  if (r1.result === null) {
    console.log('[04] deg strings failed on create, trying radians...')
    const r2 = await api.v1.assembly.cylindrical({
      id: asmId,
      name: 'CylRad',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB },
      zRotationLimits: { min: -0.7854, max: 1.5708 }
    })
    console.log('[04] radians result:', r2.result, 'maxLevel:', r2.maxLevel)
    if (r2.messages?.length) {
      r2.messages.forEach(m => console.log('[04] msg:', m.level, m.message))
    }

    if (r2.result) {
      const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylRad' })
      console.log('[04] getCylindrical zRotationLimits:', getR.result?.zRotationLimits)
      filewrite(getR.result, 'getCylindrical-radians')
    }
  } else {
    const getR = await api.v1.assembly.getCylindrical({ id: asmId, name: 'CylDeg' })
    console.log('[04] getCylindrical zRotationLimits:', getR.result?.zRotationLimits)
    filewrite(getR.result, 'getCylindrical-degStrings')
  }

  await snapshot('result')
  return { asmId }
}
