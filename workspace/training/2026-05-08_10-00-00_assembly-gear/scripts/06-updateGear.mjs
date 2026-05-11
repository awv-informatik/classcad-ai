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

  // Create gear with ratio=2, offset=0
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'Gear1',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 2.0, offset: 0,
  })).result
  console.log('[06] gearId:', gearId)

  // Drive rev1 to 45° to see initial state
  await api.v1.assembly.update3DConstraintValue({ id: rev1, name: 'Z_ROTATION', value: '45deg' })
  const m2before = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[06] arm2 COG before update:', JSON.stringify(m2before?.cog))

  // Update gear: change ratio to 0.5
  const u1 = await api.v1.assembly.updateGear({ id: gearId, ratio: 0.5 })
  console.log('[06] updateGear ratio=0.5:', u1.result, 'maxLevel:', u1.maxLevel)

  const m2after1 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[06] arm2 COG after ratio=0.5:', JSON.stringify(m2after1?.cog))

  // Update gear: change offset to 45deg
  const u2 = await api.v1.assembly.updateGear({ id: gearId, offset: '45deg' })
  console.log('[06] updateGear offset=45deg:', u2.result, 'maxLevel:', u2.maxLevel)

  const m2after2 = (await api.v1.part.calculateMassProperties({ id: instArm2 })).result
  console.log('[06] arm2 COG after offset=45deg:', JSON.stringify(m2after2?.cog))

  // Update gear: change name
  const u3 = await api.v1.assembly.updateGear({ id: gearId, name: 'RenamedGear' })
  console.log('[06] updateGear name:', u3.result, 'maxLevel:', u3.maxLevel)

  // Verify renamed via getGear
  const gOld = await api.v1.assembly.getGear({ id: asmId, name: 'Gear1' })
  const gNew = await api.v1.assembly.getGear({ id: asmId, name: 'RenamedGear' })
  console.log('[06] getGear old name:', gOld.result, 'maxLevel:', gOld.maxLevel)
  console.log('[06] getGear new name:', JSON.stringify(gNew.result))

  // Error: update with assembly ID (should fail like updateRevolute)
  const u4 = await api.v1.assembly.updateGear({ id: asmId, ratio: 3 })
  console.log('[06] updateGear asmId:', u4.result, 'maxLevel:', u4.maxLevel)
  filewrite({ result: u4.result, messages: u4.messages }, 'update-asmId-error')

  filewrite({
    before: m2before?.cog,
    afterRatio05: m2after1?.cog,
    afterOffset45: m2after2?.cog,
    gearOld: gOld.result,
    gearNew: gNew.result,
  }, 'updateGear-data')

  return { gearId }
}
