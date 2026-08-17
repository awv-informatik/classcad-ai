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
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Block' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Negative limits: x in [-30, -10], y in [-50, -20]
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarNeg',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffsetLimits: { min: -30, max: -10 },
    yOffsetLimits: { min: -50, max: -20 },
  })
  console.log('[11] planar result:', r.result, 'maxLevel:', r.maxLevel)

  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[11] inst2 COG:', JSON.stringify(cog2.cog))
  const origin = { x: cog2.cog.x - 15, y: cog2.cog.y - 10 }
  console.log('[11] inst2 world origin: x=', origin.x, ', y=', origin.y)
  console.log('[11] default=0, clamp to nearest: x=-10 (max), y=-20 (max)')

  filewrite({
    inst2_cog: cog2.cog,
    inst2_world_origin: origin,
    limits: { xOffset: [-30, -10], yOffset: [-50, -20] },
    note: 'Free DOF defaults to 0; clamped to nearest valid: max since 0 > max'
  }, 'negative-limits')

  return {}
}
