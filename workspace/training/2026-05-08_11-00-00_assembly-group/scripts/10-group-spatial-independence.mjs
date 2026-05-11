// Confirm grouped instances are spatially independent by using transformInstanceTo
// (which uses the 3-element [origin, xDir, yDir] format that works)
export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'BoxA' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'CylB' })).result
  await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 25, diameter: 16 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Box1', transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Cyl1', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Group them
  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'G1', instanceIds: [inst1, inst2] })).result

  await snapshot('before-move')

  // Move inst1 using transformInstanceTo — does inst2 follow?
  const t1 = await api.v1.assembly.transformInstanceTo({ id: inst1, transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[10] transformInstanceTo inst1 result:', t1.result, 'maxLevel:', t1.maxLevel)

  await snapshot('after-move-inst1')

  // Measure both COGs
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[10] inst1 COG after move:', JSON.stringify(cog1.cog))
  console.log('[10] inst2 COG after move:', JSON.stringify(cog2.cog))

  // inst1 should be at ~[20, 95, 10] (origin [0,80,0] + local COG [20,15,10])
  // inst2 should still be at ~[60, 0, 12.5] (unchanged)
  filewrite({ inst1: cog1.cog, inst2: cog2.cog }, 'spatial-independence')

  const moved1 = Math.abs(cog1.cog.y - 95) < 1
  const stayed2 = Math.abs(cog2.cog.y) < 1
  console.log('[10] inst1 moved to y~95:', moved1)
  console.log('[10] inst2 stayed at y~0:', stayed2)
  console.log('[10] Conclusion: grouped instances are spatially INDEPENDENT:', moved1 && stayed2)

  return { groupId }
}
