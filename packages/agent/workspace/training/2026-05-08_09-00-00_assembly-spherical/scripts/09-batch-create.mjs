export default async function (api, { snapshot, filewrite }) {
  // Test batch creation: pass array of params to spherical
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm1',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm2',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Batch create: pass array
  const r = await api.v1.assembly.spherical([
    {
      id: asmId, name: 'Ball_A',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB }
    },
    {
      id: asmId, name: 'Ball_B',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst3], csys: wcsB },
      yRotationLimits: { max: '90deg' }
    }
  ])
  console.log('[09] batch result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)

  // Verify both created
  const gA = (await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_A' })).result
  const gB = (await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_B' })).result
  console.log('[09] getA:', JSON.stringify(gA))
  console.log('[09] getB:', JSON.stringify(gB))

  // Verify COGs
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
  const cog3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[09] inst2 COG:', JSON.stringify(cog2))
  console.log('[09] inst3 COG:', JSON.stringify(cog3))

  filewrite({
    batchResult: r.result,
    maxLevel: r.maxLevel,
    constraintA: gA,
    constraintB: gB,
    cogInst2: cog2,
    cogInst3: cog3
  }, 'batch-create-data')

  await snapshot('batch-create')
  return { asmId }
}
