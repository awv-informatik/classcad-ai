export default async function (api, { snapshot, filewrite }) {
  // Test: can gear link two cylindrical constraints?
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

  // Two cylindrical constraints
  const cyl1 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl1',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm1], csys: wcsB },
  })).result
  console.log('[09] cyl1:', cyl1)

  const cyl2 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'Cyl2',
    mate1: { path: [instBase], csys: wcsA },
    mate2: { path: [instArm2], csys: wcsC },
  })).result
  console.log('[09] cyl2:', cyl2)

  // Gear on cylindrical constraints
  const gearRes = await api.v1.assembly.gear({
    id: asmId, name: 'CylGear',
    constr1Id: cyl1, constr2Id: cyl2,
    ratio: 2.0,
  })
  console.log('[09] gear on cylindrical:', gearRes.result, 'maxLevel:', gearRes.maxLevel)

  if (gearRes.result) {
    // Drive cyl1 rotation
    await api.v1.assembly.update3DConstraintValue({ id: cyl1, name: 'Z_ROTATION', value: '45deg' })
    const m1 = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
    const m2 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
    console.log('[09] arm1 COG after drive:', JSON.stringify(m1?.cog))
    console.log('[09] arm2 COG after drive:', JSON.stringify(m2?.cog))
    await snapshot('cylindrical-gear-driven')
  }

  // Also test: mixed revolute + cylindrical
  const asmId2 = (await api.v1.assembly.create({})).result

  const tplD = (await api.v1.assembly.partTemplate({ name: 'Base2' })).result
  await api.v1.part.box({ id: tplD, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsD = (await api.v1.part.workCSys({ id: tplD, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplE = (await api.v1.assembly.partTemplate({ name: 'Arm3' })).result
  await api.v1.part.box({ id: tplE, name: 'Box', length: 50, width: 10, height: 6 })
  const wcsE = (await api.v1.part.workCSys({ id: tplE, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplF = (await api.v1.assembly.partTemplate({ name: 'Arm4' })).result
  await api.v1.part.box({ id: tplF, name: 'Box', length: 35, width: 10, height: 6 })
  const wcsF = (await api.v1.part.workCSys({ id: tplF, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId2 })

  const instBase2 = (await api.v1.assembly.instance({ productId: tplD, ownerId: asmId2, name: 'Base2' })).result
  const instArm3 = (await api.v1.assembly.instance({ productId: tplE, ownerId: asmId2, name: 'Arm3' })).result
  const instArm4 = (await api.v1.assembly.instance({ productId: tplF, ownerId: asmId2, name: 'Arm4' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId2, name: 'Ground2', mate1: { path: [instBase2], csys: wcsD } })

  const rev = (await api.v1.assembly.revolute({
    id: asmId2, name: 'Rev',
    mate1: { path: [instBase2], csys: wcsD },
    mate2: { path: [instArm3], csys: wcsE },
    zOffset: 10,
  })).result

  const cyl = (await api.v1.assembly.cylindrical({
    id: asmId2, name: 'Cyl',
    mate1: { path: [instBase2], csys: wcsD },
    mate2: { path: [instArm4], csys: wcsF },
  })).result

  const mixedGear = await api.v1.assembly.gear({
    id: asmId2, name: 'MixedGear',
    constr1Id: rev, constr2Id: cyl,
    ratio: 1.5,
  })
  console.log('[09] mixed gear (rev+cyl):', mixedGear.result, 'maxLevel:', mixedGear.maxLevel)

  filewrite({
    cylGear: { result: gearRes.result, maxLevel: gearRes.maxLevel, messages: gearRes.messages },
    mixedGear: { result: mixedGear.result, maxLevel: mixedGear.maxLevel, messages: mixedGear.messages },
  }, 'cylindrical-gear-data')

  return { gearOnCyl: gearRes.result, mixedGear: mixedGear.result }
}
