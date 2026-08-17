export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create part and assembly templates
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: partTpl, length: 40, width: 30, height: 20 })

  const asmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'ExistingSub' })).result

  // Put instances in root
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  await api.v1.assembly.instance({ productId: partTpl, ownerId: asmId })

  // Convert
  await api.v1.assembly.convertToTemplate({ name: 'ConvertedSub' })

  // List ALL assembly templates
  const allAsm = await api.v1.assembly.getAssemblyTemplate({})
  console.log('[14] all assembly templates:', allAsm.result)

  // Find each by name
  const findConverted = await api.v1.assembly.getAssemblyTemplate({ name: 'ConvertedSub' })
  const findExisting = await api.v1.assembly.getAssemblyTemplate({ name: 'ExistingSub' })
  console.log('[14] find "ConvertedSub":', findConverted.result)
  console.log('[14] find "ExistingSub":', findExisting.result)

  // List all part templates (should be unchanged)
  const allPart = await api.v1.assembly.getPartTemplate({})
  console.log('[14] all part templates:', allPart.result)

  filewrite({
    allAssemblyTemplates: allAsm.result,
    convertedId: findConverted.result,
    existingId: findExisting.result,
    allPartTemplates: allPart.result,
  }, 'get-template-after')

  return {}
}
