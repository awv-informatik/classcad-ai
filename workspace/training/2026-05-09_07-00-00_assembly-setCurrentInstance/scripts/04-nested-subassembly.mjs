export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create a part template
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })

  // Create a sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[04] subAsmTpl:', subAsmTpl)

  // Add an instance of BoxPart into the sub-assembly template
  const innerInst = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: subAsmTpl, name: 'InnerBox',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] innerInst (in subAsm template):', innerInst)

  // Return to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly into the root
  const subInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] subInst (subAsm instance in root):', subInst)

  // Also add a direct box instance at the root for comparison
  const directInst = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'DirectBox',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] directInst:', directInst)

  // Test 1: setCurrentInstance to the sub-assembly instance
  const r1 = await api.v1.assembly.setCurrentInstance({ id: subInst })
  console.log('[04] setCurrentInstance(subInst) result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Check what product this set by querying previous
  const rPrev1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[04] After setCurrentInstance(subInst), previous product:', rPrev1.result)
  console.log('[04] (subAsmTpl =', subAsmTpl, ')')

  // Test 2: Can we setCurrentInstance to the inner instance (child of sub-assembly)?
  // First, get the expanded tree inner instance ID
  const innerInstances = (await api.v1.assembly.getInstance({ ownerId: subInst })).result
  console.log('[04] innerInstances from subInst:', JSON.stringify(innerInstances))
  filewrite(innerInstances, 'inner-instances')

  if (innerInstances && innerInstances.length > 0) {
    const expandedInnerId = innerInstances[0].id || innerInstances[0]
    console.log('[04] expandedInnerId:', expandedInnerId)

    const r2 = await api.v1.assembly.setCurrentInstance({ id: expandedInnerId })
    console.log('[04] setCurrentInstance(expandedInner) result:', r2.result, 'maxLevel:', r2.maxLevel)

    const rPrev2 = await api.v1.assembly.setCurrentProduct({ id: asmId })
    console.log('[04] After setCurrentInstance(expandedInner), previous product:', rPrev2.result)
    console.log('[04] (tpl1 =', tpl1, ')')
  }

  await snapshot('nested')

  return { asmId, tpl1, subAsmTpl, innerInst, subInst, directInst }
}
