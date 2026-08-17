export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with two part templates, grounded inst1, revolute between them
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm', transformation: [[100, 50, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create revolute with zOffset=0
  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Hinge',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result
  console.log('[01] revolute created:', revId, 'maxLevel:', (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).maxLevel)

  // Measure COG before update
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst2 COG before:', JSON.stringify(cogBefore?.cog))

  await snapshot('before-update')

  // Update zOffset to 25
  const ur1 = await api.v1.assembly.updateRevolute({ id: revId, zOffset: 25 })
  console.log('[01] updateRevolute zOffset=25:', ur1.result, 'maxLevel:', ur1.maxLevel)

  // Measure COG after
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst2 COG after zOffset=25:', JSON.stringify(cogAfter?.cog))

  await snapshot('after-zOffset-25')

  // Update zOffset to -10 (negative)
  const ur2 = await api.v1.assembly.updateRevolute({ id: revId, zOffset: -10 })
  console.log('[01] updateRevolute zOffset=-10:', ur2.result, 'maxLevel:', ur2.maxLevel)

  const cogNeg = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst2 COG after zOffset=-10:', JSON.stringify(cogNeg?.cog))

  await snapshot('after-zOffset-neg10')

  // Verify via getRevolute
  const state = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
  console.log('[01] getRevolute zOffset:', state.zOffset)

  filewrite({
    cogBefore: cogBefore?.cog,
    cogAfterPlus25: cogAfter?.cog,
    cogAfterNeg10: cogNeg?.cog,
    finalState: state,
  }, 'zOffset-data')

  return { revId }
}
