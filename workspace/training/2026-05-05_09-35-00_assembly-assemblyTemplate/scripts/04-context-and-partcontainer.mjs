export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a part template at root level
  const rootPart = (await api.v1.assembly.partTemplate({ name: 'RootPart' })).result
  console.log('[04] root-level partTemplate:', rootPart)

  // Create an assembly template
  const subAsmId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[04] assemblyTemplate:', subAsmId)

  // Check: does assemblyTemplate switch currentProduct?
  const r1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[04] currentProduct after assemblyTemplate (via setCurrentProduct prev):', r1.result)
  // If r1.result == asmId (12), that means context was already at root — assemblyTemplate did NOT switch.
  // If r1.result == subAsmId (something else), it DID switch.

  // Now set context to sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: subAsmId })

  // Create a part template while context is on the sub-assembly
  const subPart = (await api.v1.assembly.partTemplate({ name: 'SubPart' })).result
  console.log('[04] partTemplate in subAsm context:', subPart)

  // Check: does the part template live in the GLOBAL PartContainer,
  // or is it somehow associated with the sub-assembly?
  // Use getPartTemplate to find all templates
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const allParts = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[04] all part templates (from root context):', JSON.stringify(allParts))

  // Try from sub-assembly context
  await api.v1.assembly.setCurrentProduct({ id: subAsmId })
  const subParts = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[04] all part templates (from subAsm context):', JSON.stringify(subParts))

  // Check: can we instance the root-level part template inside the sub-assembly?
  const instInSub = (await api.v1.assembly.instance({
    productId: rootPart,
    ownerId: subAsmId,
    name: 'RootPartInSub',
  })).result
  console.log('[04] instance rootPart in subAsm:', instInSub)

  // Can we instance the sub-level part template inside the sub-assembly?
  const instSubPart = (await api.v1.assembly.instance({
    productId: subPart,
    ownerId: subAsmId,
    name: 'SubPartInSub',
  })).result
  console.log('[04] instance subPart in subAsm:', instSubPart)

  // Dump structure to verify topology
  const structR = await api.v1.assembly.setCurrentProduct({ id: asmId })
  filewrite(structR.structure, 'context-structure')

  return { rootPart, subAsmId, subPart, allParts, subParts }
}
