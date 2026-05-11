export default async function (api, { snapshot, filewrite }) {
  // Clean offset test: create gear with offset, drive, measure ONCE
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

  // Test A: ratio=1, offset=90deg, NO drive (angle=0)
  // Expected: arm1 at 0°, arm2 at some angle from offset
  const gearA = (await api.v1.assembly.gear({
    id: asmId, name: 'GearA',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 1.0, offset: '90deg',
  })).result

  const mA1 = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const mA2 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[10] Test A (ratio=1, offset=90, no drive):')
  console.log('[10]   arm1:', JSON.stringify(mA1?.cog))
  console.log('[10]   arm2:', JSON.stringify(mA2?.cog))
  await snapshot('test-A-no-drive')

  // Drive to 0° explicitly to lock the angle
  const drA = await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: 0 })
  console.log('[10]   drive rev1 to 0:', drA.maxLevel)
  const mA1d = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const mA2d = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[10]   arm1 after drive 0:', JSON.stringify(mA1d?.cog))
  console.log('[10]   arm2 after drive 0:', JSON.stringify(mA2d?.cog))

  // Now drive rev1 to 45°
  await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: '45deg' })
  const mA1e = (await api.v1.part.calculateMassProperties({ id: instArm1 })).result
  const mA2e = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[10]   arm1 after drive 45:', JSON.stringify(mA1e?.cog))
  console.log('[10]   arm2 after drive 45:', JSON.stringify(mA2e?.cog))
  await snapshot('test-A-drive-45')

  filewrite({
    testA: {
      noDrive: { arm1: mA1?.cog, arm2: mA2?.cog },
      drive0: { arm1: mA1d?.cog, arm2: mA2d?.cog },
      drive45: { arm1: mA1e?.cog, arm2: mA2e?.cog },
    },
  }, 'offset-clean')

  return { gearA }
}
