export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create a few assembly templates
  const tpl1 = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const tpl2 = (await api.v1.assembly.assemblyTemplate({ name: 'Beta' })).result
  const tpl3 = (await api.v1.assembly.assemblyTemplate({ name: 'Gamma' })).result
  console.log('[01] created templates:', tpl1, tpl2, tpl3)

  // List all — no args
  const listAll = await api.v1.assembly.getAssemblyTemplate()
  console.log('[01] listAll result:', JSON.stringify(listAll.result))
  console.log('[01] listAll maxLevel:', listAll.maxLevel)
  console.log('[01] listAll type:', typeof listAll.result, Array.isArray(listAll.result))

  // List all — empty object
  const listEmpty = await api.v1.assembly.getAssemblyTemplate({})
  console.log('[01] listEmpty result:', JSON.stringify(listEmpty.result))

  // Lookup by name — exact match
  const findBeta = await api.v1.assembly.getAssemblyTemplate({ name: 'Beta' })
  console.log('[01] findBeta result:', findBeta.result, 'type:', typeof findBeta.result, 'isArray:', Array.isArray(findBeta.result))
  console.log('[01] findBeta maxLevel:', findBeta.maxLevel)
  console.log('[01] findBeta === tpl2?', findBeta.result === tpl2)

  filewrite({
    createdIds: { tpl1, tpl2, tpl3 },
    listAll: { result: listAll.result, maxLevel: listAll.maxLevel, messages: listAll.messages },
    listEmpty: { result: listEmpty.result, maxLevel: listEmpty.maxLevel },
    findBeta: { result: findBeta.result, maxLevel: findBeta.maxLevel, messages: findBeta.messages },
  }, 'basic-results')

  return { asmId, tpl1, tpl2, tpl3 }
}
