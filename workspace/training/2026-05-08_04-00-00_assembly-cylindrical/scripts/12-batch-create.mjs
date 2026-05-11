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
    productId: tplB, ownerId: asmId, name: 'Arm1',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm2',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Batch create two cylindrical constraints
  const batchR = await api.v1.assembly.cylindrical([
    {
      id: asmId, name: 'Cyl-Batch1',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB },
      zOffsetLimits: { min: 10, max: 20 }
    },
    {
      id: asmId, name: 'Cyl-Batch2',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst3], csys: wcsB },
      zOffsetLimits: { min: 25, max: 35 }
    }
  ])
  console.log('[12] batch result:', batchR.result)
  console.log('[12] batch maxLevel:', batchR.maxLevel)

  // Verify positions
  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result?.cog
  const cog3 = (await api.v1.part.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[12] inst2 COG (started z=15, range 10..20):', cog2)
  console.log('[12] inst3 COG (started z=30, range 25..35):', cog3)

  await snapshot('batch')

  return { asmId }
}
