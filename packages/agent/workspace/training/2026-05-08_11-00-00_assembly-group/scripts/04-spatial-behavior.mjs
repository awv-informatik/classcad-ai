// Does grouping instances make them move together when one is transformed?
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

  // Measure COG before grouping
  const cogBefore1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cogBefore2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG before group - inst1:', JSON.stringify(cogBefore1.cog))
  console.log('[04] COG before group - inst2:', JSON.stringify(cogBefore2.cog))

  await snapshot('before-group')

  // Group them
  const groupId = (await api.v1.assembly.group({ id: asmId, name: 'G1', instanceIds: [inst1, inst2] })).result
  console.log('[04] groupId:', groupId)

  // Measure COG after grouping (grouping alone should not change positions)
  const cogAfterGroup1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cogAfterGroup2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after group - inst1:', JSON.stringify(cogAfterGroup1.cog))
  console.log('[04] COG after group - inst2:', JSON.stringify(cogAfterGroup2.cog))

  await snapshot('after-group')

  // Try transformInstance on inst1 — does inst2 follow?
  const t1 = await api.v1.assembly.transformInstance({ id: inst1, transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]] })
  console.log('[04] transformInstance result:', t1.result, 'maxLevel:', t1.maxLevel)

  const cogAfterTransform1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cogAfterTransform2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[04] COG after transform inst1:', JSON.stringify(cogAfterTransform1.cog))
  console.log('[04] COG after transform inst2:', JSON.stringify(cogAfterTransform2.cog))

  await snapshot('after-transform-inst1')

  filewrite({
    before: { inst1: cogBefore1.cog, inst2: cogBefore2.cog },
    afterGroup: { inst1: cogAfterGroup1.cog, inst2: cogAfterGroup2.cog },
    afterTransform: { inst1: cogAfterTransform1.cog, inst2: cogAfterTransform2.cog },
  }, 'cog-comparison')

  return { groupId }
}
