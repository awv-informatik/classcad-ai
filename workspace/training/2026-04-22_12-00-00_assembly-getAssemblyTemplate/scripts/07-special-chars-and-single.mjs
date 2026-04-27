export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Special characters — assemblyTemplate sanitizes to underscores but preserves originalName
  const specTpl = (await api.v1.assembly.assemblyTemplate({ name: 'My Sub (v2)' })).result
  console.log('[07] special char template:', specTpl)

  // List all — only 1 template, should be array
  const listOne = await api.v1.assembly.getAssemblyTemplate()
  console.log('[07] listOne:', JSON.stringify(listOne.result), 'isArray:', Array.isArray(listOne.result))

  // Find by sanitized name (underscores)
  const findSanitized = await api.v1.assembly.getAssemblyTemplate({ name: 'My_Sub__v2_' })
  console.log('[07] findSanitized:', findSanitized.result, 'maxLevel:', findSanitized.maxLevel)

  // Find by original name (parens, spaces)
  const findOriginal = await api.v1.assembly.getAssemblyTemplate({ name: 'My Sub (v2)' })
  console.log('[07] findOriginal:', findOriginal.result, 'maxLevel:', findOriginal.maxLevel)

  // getAssemblyTemplate with undefined param
  const findUndef = await api.v1.assembly.getAssemblyTemplate(undefined)
  console.log('[07] findUndef:', JSON.stringify(findUndef.result), 'isArray:', Array.isArray(findUndef.result))

  filewrite({
    specTpl,
    listOne: listOne.result,
    findSanitized: { result: findSanitized.result, maxLevel: findSanitized.maxLevel, messages: findSanitized.messages },
    findOriginal: { result: findOriginal.result, maxLevel: findOriginal.maxLevel, messages: findOriginal.messages },
    findUndef: findUndef.result,
  }, 'special-chars')

  return { asmId }
}
