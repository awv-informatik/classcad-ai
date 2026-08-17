export default async function (api, { filewrite }) {
  // Create assembly with an existing assembly template named "SubAsm"
  const asmId = (await api.v1.assembly.create({ name: 'TestRoot' })).result
  const existingTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[08] existing template "SubAsm":', existingTpl)

  // Try converting with the same name "SubAsm"
  const r = await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })
  console.log('[08] convert with duplicate name result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[08] messages:', JSON.stringify(r.messages))

  // Check how many templates named "SubAsm" exist now
  const newRoot = r.structure?.root
  const tplByName = (await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })).result
  const allTpls = (await api.v1.assembly.getAssemblyTemplate({})).result
  console.log('[08] getAssemblyTemplate("SubAsm"):', tplByName)
  console.log('[08] all assembly templates:', JSON.stringify(allTpls))

  // Check if both still exist and are distinct
  console.log('[08] existing template was:', existingTpl)
  console.log('[08] converted template is:', tplByName)

  filewrite({
    existingTpl,
    convertResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    newRoot,
    tplByName,
    allTpls,
    areSameId: existingTpl === tplByName,
  }, 'name-collision')

  return {}
}
