export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CtxTest' })).result

  // Create assembly template
  const subId = (await api.v1.assembly.assemblyTemplate({ name: 'SubCtx' })).result

  // Check: currentProduct should still be asmId
  const r1 = await api.v1.assembly.getAssemblyTemplate({ name: 'SubCtx' })
  console.log('[06] after assemblyTemplate: currentProduct =', r1.structure?.currentProduct, '(expect', asmId, ')')

  // Switch into assembly template
  const prev1 = (await api.v1.assembly.setCurrentProduct({ id: subId })).result
  console.log('[06] setCurrentProduct(subId) returns prev:', prev1, '(expect', asmId, ')')

  // Verify currentProduct is now subId
  const r2 = await api.v1.assembly.getAssemblyTemplate({ name: 'SubCtx' })
  console.log('[06] after switch: currentProduct =', r2.structure?.currentProduct, '(expect', subId, ')')

  // Can we create a partTemplate while inside assembly template context?
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'InnerPart' })).result
  console.log('[06] partTemplate inside subAsm context:', partTpl)

  // Check: where did the part template land? PartContainer, not inside the assembly template
  const r3 = await api.v1.assembly.getPartTemplate({ name: 'InnerPart' })
  console.log('[06] getPartTemplate(InnerPart):', r3.result)

  // Can we instance the part into the assembly template?
  const inst = await api.v1.assembly.instance({
    productId: partTpl,
    ownerId: subId,
    name: 'InnerInst',
  })
  console.log('[06] instance inside subAsm:', inst.result, 'maxLevel:', inst.maxLevel)

  // Switch back
  const prev2 = (await api.v1.assembly.setCurrentProduct({ id: asmId })).result
  console.log('[06] setCurrentProduct(asmId) returns prev:', prev2, '(expect', subId, ')')

  return { asmId, subId, partTpl }
}
