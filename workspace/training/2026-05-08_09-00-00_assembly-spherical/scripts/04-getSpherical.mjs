export default async function (api, { snapshot, filewrite }) {
  // Test getSpherical: return structure, missing name, multiple constraints
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'CsysA', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'CsysB', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.cylinder({ id: tplC, name: 'Cyl', height: 30, diameter: 8 })
  const wcsC = (await api.v1.part.workCSys({
    id: tplC, name: 'CsysC', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplC, ownerId: asmId, name: 'Rod',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Create two spherical constraints with different params
  const s1 = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball_A',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    yRotationLimits: { max: '30deg' }
  })
  console.log('[04] constraint 1:', s1.result, 'maxLevel:', s1.maxLevel)

  const s2 = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball_B',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC }
  })
  console.log('[04] constraint 2:', s2.result, 'maxLevel:', s2.maxLevel)

  // Get by name (found)
  const gA = await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_A' })
  console.log('[04] getSpherical Ball_A:', JSON.stringify(gA.result))
  console.log('[04] getSpherical Ball_A maxLevel:', gA.maxLevel)

  // Get by name (not found)
  const gX = await api.v1.assembly.getSpherical({ id: asmId, name: 'NonExistent' })
  console.log('[04] getSpherical NonExistent:', JSON.stringify(gX.result), 'maxLevel:', gX.maxLevel)
  if (gX.messages?.length) console.log('[04] nonexistent messages:', JSON.stringify(gX.messages))

  // Get by instance ID
  const gInst = await api.v1.assembly.getSpherical({ id: inst2, name: 'Ball_A' })
  console.log('[04] getSpherical by instId:', JSON.stringify(gInst.result))

  filewrite({
    getA: gA.result,
    getNonExistent: { result: gX.result, maxLevel: gX.maxLevel, messages: gX.messages },
    getByInst: gInst.result
  }, 'getSpherical-data')

  await snapshot('getSpherical')
  return { asmId }
}
