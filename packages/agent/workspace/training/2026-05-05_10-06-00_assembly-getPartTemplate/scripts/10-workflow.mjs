export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'WorkflowTest' })).result

  // Create templates
  const t1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: t1, name: 'Body', length: 80, width: 60, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const t2 = (await api.v1.assembly.partTemplate({ name: 'Pillar' })).result
  await api.v1.part.cylinder({ id: t2, name: 'Cyl', height: 40, diameter: 12 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Look up templates by name (the idiomatic pattern)
  const baseId = (await api.v1.assembly.getPartTemplate({ name: 'Base' })).result
  const pillarId = (await api.v1.assembly.getPartTemplate({ name: 'Pillar' })).result

  console.log('[10] created Base:', t1, 'Pillar:', t2)
  console.log('[10] looked up Base:', baseId, 'Pillar:', pillarId)
  console.log('[10] match:', baseId === t1 && pillarId === t2)

  // Instance using IDs from getPartTemplate
  const inst1 = (await api.v1.assembly.instance({ productId: baseId, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: pillarId, ownerId: asmId,
    transformation: [[10, 10, 10], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: pillarId, ownerId: asmId,
    transformation: [[60, 40, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  // Verify all templates still listed after instancing
  const allAfter = await api.v1.assembly.getPartTemplate()
  console.log('[10] all after instancing:', JSON.stringify(allAfter.result))

  // Verify spatial positions via COG
  const cogBase = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const cogPillar1 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  const cogPillar2 = (await api.v1.part.calculateMassProperties({ id: inst3 })).result

  console.log('[10] base COG:', cogBase?.cog)
  console.log('[10] pillar1 COG:', cogPillar1?.cog)
  console.log('[10] pillar2 COG:', cogPillar2?.cog)

  await snapshot('workflow')

  filewrite({
    createdIds: { base: t1, pillar: t2 },
    lookedUp: { base: baseId, pillar: pillarId },
    allAfterInstancing: allAfter.result,
    cog: {
      base: cogBase?.cog,
      pillar1: cogPillar1?.cog,
      pillar2: cogPillar2?.cog,
    },
  }, 'workflow-results')

  return { asmId }
}
