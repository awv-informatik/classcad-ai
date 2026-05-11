export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Asymmetric arm so rotation is visible
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Test reorient with free rotation (should be invisible)
  const instFree = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm_free' })).result
  await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarFree',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [instFree], csys: wcsB, reorient: '90' },
    zOffset: 15,
  })
  const cogFree = (await api.v1.part.calculateMassProperties({ id: instFree })).result
  console.log('[07] reorient=90, free rotation COG:', JSON.stringify(cogFree.cog))

  // Test reorient with locked rotation (should be visible)
  const instLocked = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm_locked' })).result
  await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarLocked',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [instLocked], csys: wcsB, reorient: '90' },
    zOffset: 15,
    zRotationLimits: { min: 0, max: 0 },
  })
  const cogLocked = (await api.v1.part.calculateMassProperties({ id: instLocked })).result
  console.log('[07] reorient=90, locked rotation COG:', JSON.stringify(cogLocked.cog))

  // Baseline: no reorient, locked rotation
  const instBase = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm_base' })).result
  await api.v1.assembly.planar({
    id: asmId,
    name: 'PlanarBase',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [instBase], csys: wcsB },
    zOffset: 40,
    zRotationLimits: { min: 0, max: 0 },
  })
  const cogBase = (await api.v1.part.calculateMassProperties({ id: instBase })).result
  console.log('[07] no reorient, locked rotation COG:', JSON.stringify(cogBase.cog))

  filewrite({
    free_reorient90: cogFree.cog,
    locked_reorient90: cogLocked.cog,
    locked_noreorient: cogBase.cog,
  }, 'reorient-comparison')

  await snapshot('reorient')

  return {}
}
