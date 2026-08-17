export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a sub-assembly template with its own child
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 30, height: 20 })

  // Add part instance to sub-assembly template
  await api.v1.assembly.setCurrentProduct({ id: subTplId })
  const childInst = (await api.v1.assembly.instance({ productId: partTplId, ownerId: subTplId, name: 'Child1' })).result
  console.log('[05] childInst in template:', childInst)

  // Place sub-assembly instance in root
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const subInst = (await api.v1.assembly.instance({ productId: subTplId, ownerId: asmId, name: 'SubInst' })).result
  console.log('[05] subInst in root:', subInst)

  // Query children of the sub-assembly INSTANCE (expanded tree)
  const rSubChildren = await api.v1.assembly.getInstance({ ownerId: subInst })
  console.log('[05] sub-instance children:', JSON.stringify(rSubChildren.result))
  console.log('[05] sub-instance maxLevel:', rSubChildren.maxLevel)

  // Query by name in expanded tree
  const rByName = await api.v1.assembly.getInstance({ ownerId: subInst, name: 'Child1' })
  console.log('[05] by name in instance:', rByName.result)

  // Query root assembly
  const rRoot = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[05] root children:', JSON.stringify(rRoot.result))

  filewrite({
    childInstInTemplate: childInst,
    subInstInRoot: subInst,
    subChildren: { result: rSubChildren.result, maxLevel: rSubChildren.maxLevel, messages: rSubChildren.messages },
    byNameInInstance: { result: rByName.result, maxLevel: rByName.maxLevel },
    rootChildren: { result: rRoot.result },
  }, 'instance-owner')

  await snapshot('nested-assembly')
  return { asmId }
}
