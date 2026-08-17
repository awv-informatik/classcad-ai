// Test transformInstance on grouped instances WITHOUT calling calculateMassProperties first
// Also test transformInstanceTo to see if group affects transform behavior
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
  const inst3 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Box2', transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]] })).result

  await snapshot('before-group')

  // Group inst1 + inst2, leave inst3 ungrouped
  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'G1', instanceIds: [inst1, inst2] })).result
  console.log('[06] groupId:', groupId)

  // Try transformInstance on grouped inst1 — WITHOUT calculateMassProperties
  const t1 = await api.v1.assembly.transformInstance({ id: inst1, transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[06] transformInstance grouped inst1 result:', t1.result, 'maxLevel:', t1.maxLevel)
  filewrite({ result: t1.result, messages: t1.messages, maxLevel: t1.maxLevel }, 'transform-grouped')

  // Try transformInstance on ungrouped inst3
  const t2 = await api.v1.assembly.transformInstance({ id: inst3, transformation: [[0, 110, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[06] transformInstance ungrouped inst3 result:', t2.result, 'maxLevel:', t2.maxLevel)
  filewrite({ result: t2.result, messages: t2.messages, maxLevel: t2.maxLevel }, 'transform-ungrouped')

  // Try transformInstanceTo on grouped inst2
  const t3 = await api.v1.assembly.transformInstanceTo({ id: inst2, transformation: [[100, 50, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[06] transformInstanceTo grouped inst2 result:', t3.result, 'maxLevel:', t3.maxLevel)
  filewrite({ result: t3.result, messages: t3.messages, maxLevel: t3.maxLevel }, 'transformTo-grouped')

  await snapshot('after-transforms')

  // Measure positions via calculateMassProperties on root assembly (doesn't materialize)
  const cogRoot = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] root COG:', JSON.stringify(cogRoot.cog))
  filewrite(cogRoot, 'root-mass-props')

  // Now measure individual instances (this materializes them)
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  const cog3 = (await api.v1.assembly.calculateMassProperties({ id: inst3 })).result
  console.log('[06] inst1 COG:', JSON.stringify(cog1.cog))
  console.log('[06] inst2 COG:', JSON.stringify(cog2.cog))
  console.log('[06] inst3 COG:', JSON.stringify(cog3.cog))
  filewrite({ inst1: cog1.cog, inst2: cog2.cog, inst3: cog3.cog }, 'individual-cogs')

  return { groupId }
}
