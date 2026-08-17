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

  // Create planar with NO limits (inst2 at default x=0,y=0)
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
  })).result

  const cogNoLimits = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[02] COG no limits:', JSON.stringify(cogNoLimits))

  // Update: add xOffsetLimits (min=20, max=60) — should clamp from default 0 to min=20
  const r1 = await api.v1.assembly.updatePlanar({ id: planarId, xOffsetLimits: { min: 20, max: 60 } })
  console.log('[02] update xOffsetLimits result:', r1.result, 'maxLevel:', r1.maxLevel)

  const cogWithXLimits = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[02] COG with xOffsetLimits [20,60]:', JSON.stringify(cogWithXLimits))

  // Update: change xOffsetLimits to [40, 80]
  const r2 = await api.v1.assembly.updatePlanar({ id: planarId, xOffsetLimits: { min: 40, max: 80 } })
  console.log('[02] update xOffsetLimits [40,80] result:', r2.result, 'maxLevel:', r2.maxLevel)

  const cogUpdatedXLimits = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[02] COG with xOffsetLimits [40,80]:', JSON.stringify(cogUpdatedXLimits))

  await snapshot('after-xlimits')

  filewrite({
    cogNoLimits,
    cogWithXLimits,
    cogUpdatedXLimits,
    expectedX20: 'default 0 clamped to min 20 → x≈20',
    expectedX40: 'default 0 clamped to min 40 → x≈40',
  }, 'xOffsetLimits-update')

  return { planarId }
}
