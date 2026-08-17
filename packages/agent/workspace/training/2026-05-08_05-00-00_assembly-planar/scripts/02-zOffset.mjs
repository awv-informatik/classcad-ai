export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Slider',
    transformation: [[50, 30, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with zOffset=25
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'Planar1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 25,
  })
  console.log('[02] planar result:', r.result, 'maxLevel:', r.maxLevel)

  const cog1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] inst1 COG:', JSON.stringify(cog1.cog))
  console.log('[02] inst2 COG:', JSON.stringify(cog2.cog))
  console.log('[02] inst2 world origin Z:', cog2.cog.z - 7.5, '(expected 25)')

  filewrite({
    inst1_cog: cog1.cog,
    inst2_cog: cog2.cog,
    inst2_world_origin: { x: cog2.cog.x - 15, y: cog2.cog.y - 10, z: cog2.cog.z - 7.5 },
    expected_z: 25,
  }, 'zOffset-25')

  await snapshot('zOffset25')

  return { constraintId: r.result }
}
