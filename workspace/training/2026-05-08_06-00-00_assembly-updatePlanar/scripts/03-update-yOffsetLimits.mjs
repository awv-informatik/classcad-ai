export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with yOffsetLimits [10, 50]
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
    yOffsetLimits: { min: 10, max: 50 },
  })).result

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[03] COG with yLimits [10,50]:', JSON.stringify(cogBefore))

  // Update yOffsetLimits to [30, 70]
  const r1 = await api.v1.assembly.updatePlanar({ id: planarId, yOffsetLimits: { min: 30, max: 70 } })
  console.log('[03] update yOffsetLimits [30,70] result:', r1.result, 'maxLevel:', r1.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[03] COG with yLimits [30,70]:', JSON.stringify(cogAfter))

  // Remove yOffsetLimits by passing null
  const r2 = await api.v1.assembly.updatePlanar({ id: planarId, yOffsetLimits: { min: null, max: null } })
  console.log('[03] remove yOffsetLimits result:', r2.result, 'maxLevel:', r2.maxLevel)

  const cogRemoved = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[03] COG after removing yLimits:', JSON.stringify(cogRemoved))

  await snapshot('after-remove')

  filewrite({
    cogBefore,
    cogAfter,
    cogRemoved,
    expectedBefore: 'y≈10 (default 0 clamped to min 10)',
    expectedAfter: 'y≈30 (default 0 clamped to min 30)',
    expectedRemoved: 'y≈0 (no limits, default 0)',
  }, 'yOffsetLimits-update')

  return { planarId }
}
