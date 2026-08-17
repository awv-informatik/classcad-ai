export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'AsmTplDeleteTest' })).result

  // Create an assembly template
  const asmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[05] asmTpl:', asmTpl)

  // Add a part template to the sub-assembly
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'InnerPart' })).result
  await api.v1.part.box({ id: partTpl, length: 20, width: 20, height: 20 })
  console.log('[05] partTpl:', partTpl)

  // Switch back to assembly template context, instantiate the part
  await api.v1.assembly.setCurrentProduct({ id: asmTpl })
  const inst = (await api.v1.assembly.instance({ productId: partTpl, ownerId: asmTpl })).result
  console.log('[05] inst in asmTpl:', inst)

  // Switch back to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Check assembly templates before
  const asmBefore = await api.v1.assembly.getAssemblyTemplate({})
  console.log('[05] assembly templates before:', JSON.stringify(asmBefore.result))

  // Delete the assembly template
  const r = await api.v1.assembly.deleteTemplate({ ids: [asmTpl] })
  console.log('[05] delete asmTpl result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-asm-tpl')

  // Check both template lists after
  const asmAfter = await api.v1.assembly.getAssemblyTemplate({})
  const partAfter = await api.v1.assembly.getPartTemplate({})
  console.log('[05] assembly templates after:', JSON.stringify(asmAfter.result))
  console.log('[05] part templates after:', JSON.stringify(partAfter.result))
  filewrite({ asmTemplates: asmAfter.result, partTemplates: partAfter.result }, 'after-state')

  return { asmId }
}
