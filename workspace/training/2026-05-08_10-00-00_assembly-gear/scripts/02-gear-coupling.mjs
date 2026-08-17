export default async function (api, { snapshot, filewrite }) {
  // Assembly with ground + two arms on revolute joints linked by gear ratio=2
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

  // Ground the base
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [instBase], csys: wcsA } })

  // Two revolutes: base→arm1, base→arm2
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

  // Gear: ratio=2, offset=0. When rev1 rotates θ, rev2 should rotate 2θ.
  const gearId = (await api.v1.assembly.gear({
    id: asmId, name: 'Gear1',
    constr1Id: rev1, constr2Id: rev2,
    ratio: 2.0, offset: 0,
  })).result
  console.log('[02] gearId:', gearId)

  // Measure COG before rotation
  const cog1Before = (await api.v1.assembly.calculateMassProperties({ id: instArm1 })).result
  const cog2Before = (await api.v1.assembly.calculateMassProperties({ id: instArm2 })).result
  console.log('[02] arm1 COG before:', [cog1Before.cogX, cog1Before.cogY, cog1Before.cogZ])
  console.log('[02] arm2 COG before:', [cog2Before.cogX, cog2Before.cogY, cog2Before.cogZ])
  await snapshot('before-rotation')

  // Drive rev1 to rotate 45° (π/4)
  const driveRes = await api.v1.assembly.update3DConstraintValue({
    id: rev1, name: 'Z_ROTATION', value: '45deg',
  })
  console.log('[02] drive rev1 45deg:', driveRes.result, 'maxLevel:', driveRes.maxLevel)

  // Measure COG after rotation
  const cog1After = (await api.v1.assembly.calculateMassProperties({ id: instArm1 })).result
  const cog2After = (await api.v1.assembly.calculateMassProperties({ id: instArm2 })).result
  console.log('[02] arm1 COG after:', [cog1After.cogX, cog1After.cogY, cog1After.cogZ])
  console.log('[02] arm2 COG after:', [cog2After.cogX, cog2After.cogY, cog2After.cogZ])

  filewrite({
    before: { arm1: [cog1Before.cogX, cog1Before.cogY, cog1Before.cogZ], arm2: [cog2Before.cogX, cog2Before.cogY, cog2Before.cogZ] },
    after: { arm1: [cog1After.cogX, cog1After.cogY, cog1After.cogZ], arm2: [cog2After.cogX, cog2After.cogY, cog2After.cogZ] },
    driveResult: { result: driveRes.result, maxLevel: driveRes.maxLevel, messages: driveRes.messages },
  }, 'coupling-data')

  await snapshot('after-rotation-45')

  return { gearId, rev1, rev2 }
}
