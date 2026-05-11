export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // inst2 at [40, 30, 25] — should be clamped by limits
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG before:', JSON.stringify(cogBefore?.cog))

  // Test: xOffsetLimits clamp x, yOffsetLimits clamp y, zOffsetLimits clamp z
  // inst2 starts at [40, 30, 25]
  // xOffsetLimits [10, 20] → should clamp x from 40 to 20
  // yOffsetLimits [5, 15] → should clamp y from 30 to 15
  // zOffsetLimits [10, 15] → should clamp z from 25 to 15
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'Par1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: 10, max: 20 },
    yOffsetLimits: { min: 5, max: 15 },
    zOffsetLimits: { min: 10, max: 15 },
  })
  console.log('[02] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] COG after:', JSON.stringify(cogAfter?.cog))

  // Expected if clamped: block COG local=[15,10,7.5]
  // world COG ≈ [20+15, 15+10, 15+7.5] = [35, 25, 22.5] (or near that with solver epsilon)

  filewrite({ cogBefore: cogBefore?.cog, cogAfter: cogAfter?.cog }, 'offset-limits-cog')
  await snapshot('offset-limits')
  return { asmId, inst1, inst2 }
}
