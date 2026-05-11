export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place inst2 at X=50 to test if xOffsetLimits clamp or preserve
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Slider',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Test A: xOffsetLimits with min=10, max=30
  // inst2 starts at X=50 — outside limits, should clamp to 30?
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarA',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: 10, max: 30 },
  })
  console.log('[03] planar result:', r.result, 'maxLevel:', r.maxLevel)

  const cogA = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[03] inst2 COG with xOffsetLimits {10,30}:', JSON.stringify(cogA.cog))
  console.log('[03] inst2 world origin X:', cogA.cog.x - 15, '(free DOF defaults to 0, but limits say min=10)')

  filewrite({
    inst2_cog: cogA.cog,
    inst2_world_origin: { x: cogA.cog.x - 15, y: cogA.cog.y - 10, z: cogA.cog.z - 7.5 },
    xOffsetLimits: { min: 10, max: 30 },
  }, 'xLimits-A')

  await snapshot('xLimits')

  return { constraintId: r.result }
}
