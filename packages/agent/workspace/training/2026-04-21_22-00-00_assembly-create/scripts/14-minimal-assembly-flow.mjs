export default async function (api, { snapshot, filewrite }) {
  // Full minimal flow: create assembly → part template → build geometry → instance
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[14] assembly.create:', asmId)

  // Create a part template (this switches context to the part)
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  console.log('[14] partTemplate:', tplId)

  // Build a box inside the template
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[14] box:', boxId)

  // Return to assembly context
  const prevId = (await api.v1.assembly.setCurrentProduct({ id: asmId })).result
  console.log('[14] setCurrentProduct returned previous:', prevId)

  // Create an instance of the part template
  const instR = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })
  console.log('[14] instance result:', instR.result, 'maxLevel:', instR.maxLevel)

  await snapshot('minimal-assembly')

  // Check structure
  const root = instR.structure.tree[asmId]
  console.log('[14] root instances:', JSON.stringify(root?.instances))
  console.log('[14] root instancesNested:', JSON.stringify(root?.instancesNested))

  filewrite({
    asmId,
    tplId,
    boxId,
    instanceId: instR.result,
    rootInstances: root?.instances,
    rootInstancesNested: root?.instancesNested,
  }, 'flow-result')

  return { asmId }
}
