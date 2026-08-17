// Can you group instances that already have constraints?
// Does group affect constraint-driven motion?
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 50, width: 15, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Pin' })).result
  await api.v1.part.cylinder({ id: tplC, name: 'Cyl', height: 20, diameter: 10 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1', transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Pin1', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Ground the base
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Fasten arm to base
  const fastId = (await api.v1.assembly.fastened({
    id: asmId, name: 'ArmToBase',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    xOffset: 0, yOffset: 0, zOffset: 15,
  })).result
  console.log('[07] fastened result:', fastId)

  await snapshot('before-group')

  // Group the constrained arm and pin together
  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'ArmPinGroup', instanceIds: [inst2, inst3] })).result
  console.log('[07] group with constrained instances result:', groupId)
  filewrite({ groupId }, 'group-constrained')

  await snapshot('after-group')

  // Verify group was created correctly
  const g = await api.v1.assembly.getGroup({ id: asmId, name: 'ArmPinGroup' })
  console.log('[07] getGroup:', JSON.stringify(g.result))

  // Measure positions
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const cog3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[07] COGs - base:', JSON.stringify(cog1.cog), 'arm:', JSON.stringify(cog2.cog), 'pin:', JSON.stringify(cog3.cog))
  filewrite({ base: cog1.cog, arm: cog2.cog, pin: cog3.cog }, 'cog-with-constraints')

  return { groupId }
}
