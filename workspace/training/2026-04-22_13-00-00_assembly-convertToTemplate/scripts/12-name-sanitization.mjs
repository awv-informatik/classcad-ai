export default async function (api, { filewrite }) {
  // Compare name sanitization: convertToTemplate vs assemblyTemplate
  // assemblyTemplate sanitizes spaces/parens/slashes → underscores
  // Does convertToTemplate do the same?

  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create an assemblyTemplate with special chars for comparison
  const asmTpl = await api.v1.assembly.assemblyTemplate({ name: 'Test (v1)/sub' })
  const asmTplNode = asmTpl.structure?.tree?.[String(asmTpl.result)]
  console.log('[12] assemblyTemplate — name:', asmTplNode?.name, 'originalName:', asmTplNode?.members?.originalName?.value)

  // Now convert root with same special chars pattern
  const r = await api.v1.assembly.convertToTemplate({ name: 'Conv (v1)/sub' })
  const convertedNode = r.structure?.tree?.['12']
  console.log('[12] convertToTemplate — name:', convertedNode?.name, 'originalName:', convertedNode?.members?.originalName?.value)

  // Can we find the converted template by unsanitized name?
  const findUnsanitized = await api.v1.assembly.getAssemblyTemplate({ name: 'Conv (v1)/sub' })
  console.log('[12] find by "Conv (v1)/sub":', findUnsanitized.result, 'maxLevel:', findUnsanitized.maxLevel)

  // Can we find by sanitized name (if it was sanitized)?
  const findSanitized = await api.v1.assembly.getAssemblyTemplate({ name: 'Conv__v1__sub' })
  console.log('[12] find by "Conv__v1__sub":', findSanitized.result, 'maxLevel:', findSanitized.maxLevel)

  filewrite({
    assemblyTemplate: { name: asmTplNode?.name, originalName: asmTplNode?.members?.originalName?.value },
    convertToTemplate: { name: convertedNode?.name, originalName: convertedNode?.members?.originalName?.value },
    findUnsanitized: findUnsanitized.result,
    findSanitized: findSanitized.result,
  }, 'name-sanitization')

  return {}
}
