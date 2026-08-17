export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  // Place inst2 at X=25, Y=30 — within xOffsetLimits=[10,50] and yOffsetLimits=[5,60]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[25, 30, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] inst2 COG before:', JSON.stringify(cogBefore.cog))
  console.log('[10] inst2 world origin before: x=', cogBefore.cog.x - 15, ', y=', cogBefore.cog.y - 10)

  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarInRange',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: 10, max: 50 },
    yOffsetLimits: { min: 5, max: 60 },
  })
  console.log('[10] planar result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[10] inst2 COG after:', JSON.stringify(cogAfter.cog))
  console.log('[10] inst2 world origin after: x=', cogAfter.cog.x - 15, ', y=', cogAfter.cog.y - 10)
  console.log('[10] if preserved: x=25, y=30. if reset to min: x=10, y=5')

  filewrite({
    before: { cog: cogBefore.cog, origin: { x: cogBefore.cog.x - 15, y: cogBefore.cog.y - 10 } },
    after: { cog: cogAfter.cog, origin: { x: cogAfter.cog.x - 15, y: cogAfter.cog.y - 10 } },
    limits: { xOffsetLimits: { min: 10, max: 50 }, yOffsetLimits: { min: 5, max: 60 } },
    initial_placement: { x: 25, y: 30 },
  }, 'within-range')

  return {}
}
