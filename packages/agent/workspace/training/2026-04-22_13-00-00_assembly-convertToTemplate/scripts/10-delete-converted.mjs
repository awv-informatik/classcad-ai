export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })

  // Convert
  const r = await api.v1.assembly.convertToTemplate({ name: 'ToDelete' })
  const newRoot = r.structure?.root
  const oldRoot = 12
  console.log('[10] new root:', newRoot, 'old root (converted):', oldRoot)

  // Instance the converted template
  const instR = await api.v1.assembly.instance({ productId: oldRoot, ownerId: newRoot })
  console.log('[10] instance:', instR.result)

  // Now delete the converted template
  const delR = await api.v1.assembly.deleteTemplate({ ids: [oldRoot] })
  console.log('[10] deleteTemplate result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[10] deleteTemplate messages:', JSON.stringify(delR.messages))

  // Check: the instance should be cascade-deleted
  const check = await api.v1.common.getAppVersion({})
  const rootNode = check.structure?.tree?.[String(newRoot)]
  console.log('[10] root instances after delete:', rootNode?.instances)

  // Check: assembly container should be empty
  const asmContainer = check.structure?.tree?.['10']
  console.log('[10] AssemblyContainer children:', asmContainer?.children)

  // Check: part templates should survive
  const partContainer = check.structure?.tree?.['8']
  console.log('[10] PartContainer children:', partContainer?.children)

  filewrite({
    deleteResult: delR.result,
    deleteMaxLevel: delR.maxLevel,
    rootInstancesAfter: rootNode?.instances,
    asmContainerChildren: asmContainer?.children,
    partContainerChildren: partContainer?.children,
  }, 'delete-converted')

  return {}
}
