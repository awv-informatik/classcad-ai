export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm1' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

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

  // Test negative ratio: counter-counter-rotation (same direction?)
  const g1 = (await api.v1.assembly.gear({
    id: asmId, name: 'NegGear',
    constr1Id: rev1, constr2Id: rev2,
    ratio: -2.0, offset: 0,
  })).result
  console.log('[07] gear -2.0:', g1)

  // Drive rev1 to 45°
  await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: '45deg' })

  const m1 = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const m2 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[07] arm1 COG:', JSON.stringify(m1?.cog))
  console.log('[07] arm2 COG:', JSON.stringify(m2?.cog))
  await snapshot('negative-ratio-45')

  // Test ratio=0
  const u1 = await api.v1.assembly.updateGear({ id: g1, ratio: 0 })
  console.log('[07] updateGear ratio=0:', u1.result, 'maxLevel:', u1.maxLevel)

  const m2zero = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[07] arm2 COG ratio=0:', JSON.stringify(m2zero?.cog))

  filewrite({
    negativeRatio: { arm1: m1?.cog, arm2: m2?.cog },
    zeroRatio: m2zero?.cog,
    zeroRatioUpdate: { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages },
  }, 'negative-ratio-data')

  return { gearId: g1 }
}
