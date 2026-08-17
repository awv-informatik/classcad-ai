export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm1' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm2', transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create two revolute constraints
  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })).result

  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsB },
  })).result

  console.log('[07] rev1:', rev1, 'rev2:', rev2)

  // Batch update both at once
  const ur = await api.v1.assembly.updateRevolute([
    { id: rev1, name: 'BatchHinge1', zOffset: 15 },
    { id: rev2, name: 'BatchHinge2', zOffset: 30, zRotationLimits: { min: '-45deg', max: '45deg' } },
  ])
  console.log('[07] batch result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)

  // Verify both updated
  const s1 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchHinge1' })).result
  const s2 = (await api.v1.assembly.getRevolute({ id: asmId, name: 'BatchHinge2' })).result
  console.log('[07] hinge1 name:', s1?.name, 'zOffset:', s1?.zOffset)
  console.log('[07] hinge2 name:', s2?.name, 'zOffset:', s2?.zOffset, 'limits:', JSON.stringify(s2?.zRotationLimits))

  // Spatial check
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
  const cog3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result?.cog
  console.log('[07] inst2 COG (zOffset=15):', JSON.stringify(cog2))
  console.log('[07] inst3 COG (zOffset=30):', JSON.stringify(cog3))

  await snapshot('batch-updated')

  filewrite({ batchResult: ur.result, hinge1: s1, hinge2: s2, cog2, cog3 }, 'batch-data')
  return { rev1, rev2 }
}
