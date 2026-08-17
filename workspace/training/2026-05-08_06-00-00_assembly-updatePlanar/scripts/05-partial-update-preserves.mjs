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

  // Create planar with all params set
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 25,
    xOffsetLimits: { min: 10, max: 50 },
    yOffsetLimits: { min: 5, max: 40 },
    zRotationLimits: { min: 0, max: 0 },
  })).result

  // Read initial state
  const getBefore = (await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })).result
  console.log('[05] before partial update:', JSON.stringify({
    zOffset: getBefore.zOffset,
    xOffsetLimits: getBefore.xOffsetLimits,
    yOffsetLimits: getBefore.yOffsetLimits,
    zRotationLimits: getBefore.zRotationLimits,
  }))

  // Partial update: ONLY change zOffset — other params should be preserved
  const r = await api.v1.assembly.updatePlanar({ id: planarId, zOffset: 50 })
  console.log('[05] partial update (zOffset only) result:', r.result, 'maxLevel:', r.maxLevel)

  // Read after partial update
  const getAfter = (await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })).result
  console.log('[05] after partial update:', JSON.stringify({
    zOffset: getAfter.zOffset,
    xOffsetLimits: getAfter.xOffsetLimits,
    yOffsetLimits: getAfter.yOffsetLimits,
    zRotationLimits: getAfter.zRotationLimits,
  }))

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[05] inst2 COG after partial update:', JSON.stringify(cogAfter))

  filewrite({
    before: {
      zOffset: getBefore.zOffset,
      xOffsetLimits: getBefore.xOffsetLimits,
      yOffsetLimits: getBefore.yOffsetLimits,
      zRotationLimits: getBefore.zRotationLimits,
    },
    after: {
      zOffset: getAfter.zOffset,
      xOffsetLimits: getAfter.xOffsetLimits,
      yOffsetLimits: getAfter.yOffsetLimits,
      zRotationLimits: getAfter.zRotationLimits,
    },
    zOffsetChanged: getBefore.zOffset !== getAfter.zOffset,
    xLimitsPreserved: JSON.stringify(getBefore.xOffsetLimits) === JSON.stringify(getAfter.xOffsetLimits),
    yLimitsPreserved: JSON.stringify(getBefore.yOffsetLimits) === JSON.stringify(getAfter.yOffsetLimits),
    zRotPreserved: JSON.stringify(getBefore.zRotationLimits) === JSON.stringify(getAfter.zRotationLimits),
    cogAfter,
  }, 'partial-update')

  return { planarId }
}
