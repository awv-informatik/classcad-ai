export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Arm1: 60x15x8 → local COG at (30, 7.5, 4)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Arm2: 40x12x6 → local COG at (20, 6, 3)
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

  // Gear: ratio=2, offset=0
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'Gear1',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 2.0, offset: 0,
  })).result
  console.log('[03] gearId:', gearId)

  // Measure COG before rotation
  const m1b = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2b = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[03] arm1 COG before:', JSON.stringify(m1b?.cog))
  console.log('[03] arm2 COG before:', JSON.stringify(m2b?.cog))
  await snapshot('before')

  // Drive rev1 to rotate 45°
  const dr = await api.v1.assembly.update3DConstraintValue({
    id: rev1, name: 'Z_ROTATION', value: '45deg',
  })
  console.log('[03] drive rev1 45deg: maxLevel:', dr.maxLevel)

  // Measure COG after
  const m1a = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2a = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[03] arm1 COG after:', JSON.stringify(m1a?.cog))
  console.log('[03] arm2 COG after:', JSON.stringify(m2a?.cog))
  await snapshot('after-45')

  // Drive rev1 to rotate 90°
  const dr2 = await api.v1.assembly.update3DConstraintValue({
    id: rev1, name: 'Z_ROTATION', value: '90deg',
  })
  console.log('[03] drive rev1 90deg: maxLevel:', dr2.maxLevel)

  const m1c = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2c = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[03] arm1 COG 90deg:', JSON.stringify(m1c?.cog))
  console.log('[03] arm2 COG 90deg:', JSON.stringify(m2c?.cog))
  await snapshot('after-90')

  filewrite({
    before: { arm1: m1b?.cog, arm2: m2b?.cog },
    after45: { arm1: m1a?.cog, arm2: m2a?.cog },
    after90: { arm1: m1c?.cog, arm2: m2c?.cog },
  }, 'coupling-cog')

  return { gearId }
}
