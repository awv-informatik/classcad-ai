export default async function (api, { snapshot, filewrite }) {
  // Test deleting an assembly template (not just part template)
  const asmId = (await api.v1.assembly.create({ name: 'AsmTplDeleteTest' })).result

  // Create an assembly template
  const asmTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[05] asmTplId:', asmTplId)

  // Build content inside the assembly template: add a part template and instance it
  const innerPartTpl = (await api.v1.assembly.partTemplate({ name: 'InnerPart' })).result
  await api.v1.part.box({ id: innerPartTpl, name: 'InnerBox', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmTplId })
  const innerInst = (await api.v1.assembly.instance({ productId: innerPartTpl, ownerId: asmTplId })).result
  console.log('[05] innerPartTpl:', innerPartTpl, 'innerInst:', innerInst)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instantiate the assembly template
  const outerInst = (await api.v1.assembly.instance({ productId: asmTplId, ownerId: asmId })).result
  console.log('[05] outerInst:', outerInst)

  // Check templates before
  const asmTplsBefore = await api.v1.assembly.getAssemblyTemplate({})
  const partTplsBefore = await api.v1.assembly.getPartTemplate({})
  console.log('[05] assembly templates before:', JSON.stringify(asmTplsBefore.result))
  console.log('[05] part templates before:', JSON.stringify(partTplsBefore.result))

  await snapshot('before-delete')

  // Delete the assembly template
  const r = await api.v1.assembly.deleteTemplate({ ids: [asmTplId] })
  console.log('[05] delete assembly template - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  // Check what remains
  const asmTplsAfter = await api.v1.assembly.getAssemblyTemplate({})
  const partTplsAfter = await api.v1.assembly.getPartTemplate({})
  const instancesAfter = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[05] assembly templates after:', JSON.stringify(asmTplsAfter.result))
  console.log('[05] part templates after:', JSON.stringify(partTplsAfter.result))
  console.log('[05] instances after:', JSON.stringify(instancesAfter.result))

  filewrite({
    before: { asmTemplates: asmTplsBefore.result, partTemplates: partTplsBefore.result },
    deleteResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    after: { asmTemplates: asmTplsAfter.result, partTemplates: partTplsAfter.result, instances: instancesAfter.result },
  }, 'asm-template-delete')

  await snapshot('after-delete')

  return { asmId, asmTplId, innerPartTpl, outerInst }
}
