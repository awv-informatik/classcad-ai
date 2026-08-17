export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'SliderA' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'SliderB' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 25, width: 25, height: 20 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'SliderA' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'SliderB' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const p1 = (await api.v1.assembly.planar({
    id: asmId, name: 'Planar1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  const p2 = (await api.v1.assembly.planar({
    id: asmId, name: 'Planar2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
    zOffset: 15,
  })).result

  console.log('[10] p1:', p1, 'p2:', p2)

  // Batch update both constraints at once
  const batchR = await api.v1.assembly.updatePlanar([
    { id: p1, zOffset: 30 },
    { id: p2, zOffset: 50, xOffsetLimits: { min: 20, max: 60 } },
  ])
  console.log('[10] batch update result:', JSON.stringify(batchR.result))
  console.log('[10] batch maxLevel:', batchR.maxLevel)

  // Verify both updated
  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  const cog3 = (await api.v1.part.calculateMassProperties({ id: inst3 })).result.cog
  console.log('[10] inst2 COG (z should be ~37.5):', JSON.stringify(cog2))
  console.log('[10] inst3 COG (z should be ~60, x should be ~32.5):', JSON.stringify(cog3))

  await snapshot('batch-result')

  filewrite({
    batchResult: batchR.result,
    batchMaxLevel: batchR.maxLevel,
    cog2,
    cog3,
  }, 'batch-update')

  return { p1, p2 }
}
