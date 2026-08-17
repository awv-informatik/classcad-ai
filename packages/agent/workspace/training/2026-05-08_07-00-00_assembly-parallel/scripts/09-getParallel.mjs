export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Block' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create with all optional params
  const parId = (await api.v1.assembly.parallel({
    id: asmId,
    name: 'TestPar',
    mate1: { path: [inst1], csys: wcsA, flip: 'Z', reorient: '0' },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z', reorient: '90' },
    xOffsetLimits: { min: 5, max: 50 },
    yOffsetLimits: { min: -20, max: 30 },
    zOffsetLimits: { min: 10, max: 40 },
    zRotationLimits: { min: '-45deg', max: '90deg' },
  })).result
  console.log('[09] parallel created:', parId)

  // getParallel — query by name, assembly root ID
  const g1 = await api.v1.assembly.getParallel({ id: asmId, name: 'TestPar' })
  console.log('[09] getParallel result:', JSON.stringify(g1.result), 'maxLevel:', g1.maxLevel)
  filewrite(g1.result, 'get-parallel-result')

  // Failure: wrong name
  const g2 = await api.v1.assembly.getParallel({ id: asmId, name: 'NonExistent' })
  console.log('[09] nonexistent name:', g2.result, 'maxLevel:', g2.maxLevel)

  // Failure: instance ID instead of assembly ID
  const g3 = await api.v1.assembly.getParallel({ id: inst1, name: 'TestPar' })
  console.log('[09] instance id:', g3.result, 'maxLevel:', g3.maxLevel)

  // Failure: empty name
  const g4 = await api.v1.assembly.getParallel({ id: asmId, name: '' })
  console.log('[09] empty name:', g4.result, 'maxLevel:', g4.maxLevel)

  // Batch query
  const g5 = await api.v1.assembly.getParallel([
    { id: asmId, name: 'TestPar' },
    { id: asmId, name: 'NonExist' },
  ])
  console.log('[09] batch:', JSON.stringify(g5.result?.map(r => r?.id || null)), 'maxLevel:', g5.maxLevel)

  filewrite({
    success: { result: g1.result, maxLevel: g1.maxLevel },
    wrongName: { result: g2.result, maxLevel: g2.maxLevel },
    instanceId: { result: g3.result, maxLevel: g3.maxLevel },
    emptyName: { result: g4.result, maxLevel: g4.maxLevel },
    batch: { result: g5.result, maxLevel: g5.maxLevel },
  }, 'get-parallel-tests')

  return { asmId, parId }
}
