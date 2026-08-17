export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Block' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Combined: zOffset=12, xOffsetLimits=[20,60], yOffsetLimits=[10,50], zRotationLimits locked at 0
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarCombined',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
    xOffsetLimits: { min: 20, max: 60 },
    yOffsetLimits: { min: 10, max: 50 },
    zRotationLimits: { min: 0, max: 0 },
  })
  console.log('[08] combined result:', r.result, 'maxLevel:', r.maxLevel)

  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[08] inst2 COG:', JSON.stringify(cog2.cog))
  const origin = { x: cog2.cog.x - 15, y: cog2.cog.y - 10, z: cog2.cog.z - 7.5 }
  console.log('[08] inst2 world origin:', JSON.stringify(origin))
  console.log('[08] expected: x~20 (min), y~10 (min), z=12 (zOffset)')

  filewrite({
    inst2_cog: cog2.cog,
    inst2_world_origin: origin,
    limits: { xOffset: [20, 60], yOffset: [10, 50], zOffset: 12, zRotation: [0, 0] },
  }, 'combined')

  await snapshot('combined')

  return { constraintId: r.result }
}
