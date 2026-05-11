export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Arm1: 60x15x8 → local COG (30, 7.5, 4)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Arm2: 40x12x6 → local COG (20, 6, 3)
  const tplC = (await api.v1.assembly.partTemplate({ name: 'Arm2' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 12, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instBase = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const instArm1 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const instArm2 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Arm2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [instBase], csys: wcsA } })

  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm1], csys: wcsB },
    zOffset: 15,
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm2], csys: wcsC },
    zOffset: 25,
  })).result

  // Gear: ratio=1, offset=90deg. At rest, arm2 should be 90° offset from arm1.
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'GearOffset',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 1.0, offset: '90deg',
  })).result
  console.log('[04] gearId:', gearId)

  // Measure initial position (arm1 at 0°, arm2 should be at offset angle)
  const m1 = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[04] arm1 COG initial:', JSON.stringify(m1?.cog))
  console.log('[04] arm2 COG initial:', JSON.stringify(m2?.cog))
  await snapshot('initial-with-offset')

  // Drive rev1 to 45°
  await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: '45deg' })
  const m1a = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2a = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[04] arm1 COG 45deg:', JSON.stringify(m1a?.cog))
  console.log('[04] arm2 COG 45deg:', JSON.stringify(m2a?.cog))
  await snapshot('after-45-with-offset')

  filewrite({
    initial: { arm1: m1?.cog, arm2: m2?.cog },
    after45: { arm1: m1a?.cog, arm2: m2a?.cog },
  }, 'offset-data')

  return { gearId }
}
