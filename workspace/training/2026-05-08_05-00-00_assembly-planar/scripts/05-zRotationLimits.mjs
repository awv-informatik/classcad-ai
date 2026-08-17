export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Use an asymmetric block (80x20x15) so rotation is visible
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Test A: zRotationLimits locked at 45deg
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarRot',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 15,
    zRotationLimits: { min: '45deg', max: '45deg' },
  })
  console.log('[05] planar result:', r.result, 'maxLevel:', r.maxLevel)

  const cog2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[05] inst2 COG with zRotation locked at 45deg:', JSON.stringify(cog2.cog))

  filewrite({
    inst2_cog: cog2.cog,
    inst2_world_origin: { x: cog2.cog.x - 40, y: cog2.cog.y - 10, z: cog2.cog.z - 7.5 },
    note: 'COG is in rotated frame — local COG of 80x20x15 box is (40,10,7.5), rotated 45deg around Z'
  }, 'rotation-locked-45')

  await snapshot('rot45')

  return { constraintId: r.result }
}
