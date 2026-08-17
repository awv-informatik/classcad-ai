export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Three templates: Base (box), Arm (long box), Cylinder
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Cylinder' })).result
  await api.v1.part.cylinder({ id: tplC, name: 'Cyl', diameter: 30, height: 40 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm', transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'CylInst', transformation: [[0, 100, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute between Base and Arm
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  // Measure COGs before retarget
  const cogArm = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
  const cogCyl = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[05] before retarget — Arm COG:', JSON.stringify(cogArm))
  console.log('[05] before retarget — Cyl COG:', JSON.stringify(cogCyl))

  await snapshot('before-retarget')

  // Retarget mate2 from Arm (inst2) to Cylinder (inst3)
  const ur = await api.v1.assembly.updateRevolute({
    id: revId,
    mate2: { path: [inst3], csys: wcsC },
  })
  console.log('[05] retarget result:', ur.result, 'maxLevel:', ur.maxLevel)

  // Measure COGs after retarget
  const cogArmAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
  const cogCylAfter = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[05] after retarget — Arm COG:', JSON.stringify(cogArmAfter))
  console.log('[05] after retarget — Cyl COG:', JSON.stringify(cogCylAfter))

  await snapshot('after-retarget')

  // Verify getRevolute reflects the retarget
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[05] mate2.path after retarget:', JSON.stringify(state.mate2.path))
  console.log('[05] zOffset preserved:', state.zOffset)

  filewrite({
    beforeRetarget: { arm: cogArm, cyl: cogCyl },
    afterRetarget: { arm: cogArmAfter, cyl: cogCylAfter },
    state,
  }, 'retarget-data')

  return { revId }
}
