export default async function (api, { snapshot, filewrite }) {
  // Test: xOffsetLimits clamps X only, Y and Z DOF should be preserved
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // inst2 at [40, 30, 25]
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[05] COG before:', JSON.stringify(cogBefore?.cog))

  // Only xOffsetLimits — clamps x from 40 to 20, y and z should be preserved
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'XOnly',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: 10, max: 20 },
  })
  console.log('[05] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[05] COG after (x clamped, y/z preserved?):', JSON.stringify(cogAfter?.cog))
  // Expected: x≈20+15=35, y≈30+10=40, z≈25+7.5=32.5

  filewrite({ cogBefore: cogBefore?.cog, cogAfter: cogAfter?.cog }, 'single-axis-cog')
  await snapshot('x-only-clamp')
  return { asmId }
}
