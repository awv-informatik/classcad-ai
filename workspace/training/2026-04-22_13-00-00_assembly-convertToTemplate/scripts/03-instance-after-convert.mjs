export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create part template with box
  const boxTpl = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: boxTpl, length: 60, width: 40, height: 30 })

  // Build root with an instance
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: boxTpl, ownerId: asmId, name: 'BoxInst' })

  // Convert root to template
  const r = await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })
  const newRoot = r.structure?.root
  console.log('[03] new root:', newRoot)

  // Now instance the converted template into the new root
  const oldRootId = 12
  const instR = await api.v1.assembly.instance({ productId: oldRootId, ownerId: newRoot, name: 'SubAsmInst1' })
  console.log('[03] instance of converted template:', instR.result, 'maxLevel:', instR.maxLevel)

  // Add a second instance with offset
  const instR2 = await api.v1.assembly.instance({
    productId: oldRootId,
    ownerId: newRoot,
    name: 'SubAsmInst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[03] second instance:', instR2.result, 'maxLevel:', instR2.maxLevel)

  filewrite({
    inst1: instR.result,
    inst2: instR2.result,
    newRootInstances: instR2.structure?.tree?.[String(newRoot)]?.instances,
  }, 'instance-after-convert')

  await snapshot('two-instances')

  return { newRoot }
}
