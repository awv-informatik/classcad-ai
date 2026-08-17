export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a part template containing a box
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tplId, name: 'Box1', length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the template at a known offset
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst1',
    transformation: [[25, 15, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure COG of instance BEFORE conversion using assembly.calculateMassProperties
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  console.log('[01] instance COG before:', JSON.stringify(massBefore))

  // Record structure before
  console.log('[01] root before:', asmId)
  console.log('[01] instance ID:', inst1)

  await snapshot('before-convert')

  // CONVERT to template
  const r = await api.v1.assembly.convertToTemplate({ name: 'ConvertedAsm' })
  console.log('[01] convertToTemplate result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  // Get new root from structure
  const newRoot = r.structure?.root
  const currentProduct = r.structure?.currentProduct
  console.log('[01] new root:', newRoot, 'currentProduct:', currentProduct)

  // Verify the old root (12) is now accessible as assembly template
  const convertedTplId = (await api.v1.assembly.getAssemblyTemplate({ name: 'ConvertedAsm' })).result
  console.log('[01] converted template ID:', convertedTplId)

  // Instance the converted template into the new root
  const newInst = (await api.v1.assembly.instance({
    productId: convertedTplId,
    ownerId: newRoot,
    name: 'ConvertedInst',
  })).result
  console.log('[01] new instance of converted template:', newInst)

  // Measure COG of the nested instance via the new root
  const massAfterRoot = (await api.v1.assembly.calculateMassProperties({ id: newRoot })).result
  console.log('[01] root COG after (full assembly):', JSON.stringify(massAfterRoot))

  // Also measure the newly created instance directly
  const massAfterInst = (await api.v1.assembly.calculateMassProperties({ id: newInst })).result
  console.log('[01] new instance COG after:', JSON.stringify(massAfterInst))

  await snapshot('after-convert')

  filewrite({
    rootBefore: asmId,
    rootAfter: newRoot,
    currentProduct,
    convertedTemplateId: convertedTplId,
    newInstanceId: newInst,
    massBefore,
    massAfterRoot,
    massAfterInst,
  }, 'spatial-comparison')

  return { asmId, tplId, inst1, newRoot, convertedTplId, newInst }
}
