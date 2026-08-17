export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create two part templates
  const boxTpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: boxTpl, length: 60, width: 40, height: 30 })
  const cylTpl = (await api.v1.assembly.partTemplate({ name: 'Cyl' })).result
  await api.v1.part.cylinder({ id: cylTpl, radius: 15, height: 50 })

  // Add box instance to root
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: boxTpl, ownerId: asmId, name: 'Box1' })

  // Convert root to template
  const r = await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })
  const newRoot = r.structure?.root
  const oldRoot = 12
  console.log('[09] new root:', newRoot)

  // Switch INTO the converted template
  const switchR = await api.v1.assembly.setCurrentProduct({ id: oldRoot })
  console.log('[09] setCurrentProduct to oldRoot:', switchR.result, 'maxLevel:', switchR.maxLevel)

  // Add a cylinder instance to the converted template
  const cylInst = await api.v1.assembly.instance({ productId: cylTpl, ownerId: oldRoot, name: 'CylInConvert' })
  console.log('[09] add cyl to converted template:', cylInst.result, 'maxLevel:', cylInst.maxLevel)

  // Verify the template now has 2 instances (the original box + new cyl)
  const checkR = await api.v1.common.getAppVersion({})
  const templateNode = checkR.structure?.tree?.[String(oldRoot)]
  console.log('[09] converted template instances:', templateNode?.instances)

  filewrite({
    switchResult: switchR.result,
    cylInstId: cylInst.result,
    templateInstances: templateNode?.instances,
  }, 'work-inside')

  // Switch back to new root and instance the template
  await api.v1.assembly.setCurrentProduct({ id: newRoot })
  await api.v1.assembly.instance({ productId: oldRoot, ownerId: newRoot })

  await snapshot('after-adding-to-converted')

  return { newRoot }
}
