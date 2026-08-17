export default async function (api, { snapshot, filewrite }) {
  // Key question: does parallel preserve ALL initial offsets (x, y, z) like cylindrical?
  // Or does it reset some to 0 like planar?
  // Test: place inst2 at non-zero [40, 30, 25], apply parallel with no limits, check all axes
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  // Test with limits that don't affect current position (inst2 already within range)
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Limits that include the current position — shouldn't clamp
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'Wide',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: 0, max: 100 },
    yOffsetLimits: { min: 0, max: 100 },
    zOffsetLimits: { min: 0, max: 100 },
  })
  console.log('[04] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cog = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG (should be ≈[55,40,32.5]):', JSON.stringify(cog?.cog))

  // Now test: limits that exclude current position on just one axis
  // New assembly with different inst2 position, limits that clamp X only
  // Reset and redo
  const asmId2 = (await api.v1.assembly.create({})).result

  const tplA2 = (await api.v1.assembly.partTemplate({ name: 'Base2' })).result
  await api.v1.part.box({ id: tplA2, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA2 = (await api.v1.part.workCSys({ id: tplA2, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB2 = (await api.v1.assembly.partTemplate({ name: 'Block2' })).result
  await api.v1.part.box({ id: tplB2, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB2 = (await api.v1.part.workCSys({ id: tplB2, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId2 })

  const inst1b = (await api.v1.assembly.instance({ productId: tplA2, ownerId: asmId2, name: 'Base' })).result
  const inst2b = (await api.v1.assembly.instance({
    productId: tplB2, ownerId: asmId2, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId2, name: 'Ground', mate1: { path: [inst1b], csys: wcsA2 } })

  // xOffsetLimits [10, 20] → should clamp x from 40 to 20
  // y and z unconstrained → should preserve 30 and 25
  const r2 = await api.v1.assembly.parallel({
    id: asmId2,
    name: 'XOnly',
    mate1: { path: [inst1b], csys: wcsA2 },
    mate2: { path: [inst2b], csys: wcsB2 },
    xOffsetLimits: { min: 10, max: 20 },
  })
  console.log('[04] parallel2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2b })).result
  console.log('[04] COG2 (x clamped, y/z preserved?):', JSON.stringify(cog2?.cog))
  // Expected: x≈20+15=35, y≈30+10=40, z≈25+7.5=32.5

  filewrite({
    test1_wide_limits: cog?.cog,
    test2_x_clamped: cog2?.cog,
  }, 'preservation-test')

  return { asmId, asmId2 }
}
