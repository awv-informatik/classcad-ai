export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create a template with empty name
  const tEmpty = (await api.v1.assembly.partTemplate({ name: '' })).result
  const tNamed = (await api.v1.assembly.partTemplate({ name: 'Regular' })).result

  console.log('[03] created: empty=', tEmpty, 'named=', tNamed)

  // Try to find the empty-named template
  const rEmptyStr = await api.v1.assembly.getPartTemplate({ name: '' })
  console.log('[03] getPartTemplate({name:""}): result:', rEmptyStr.result, 'maxLevel:', rEmptyStr.maxLevel)

  // List all — does empty-name template show up?
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[03] all:', JSON.stringify(rAll.result))

  filewrite({
    emptyNameLookup: { result: rEmptyStr.result, maxLevel: rEmptyStr.maxLevel, messages: rEmptyStr.messages },
    allTemplates: rAll.result,
    emptyTemplateId: tEmpty,
    namedTemplateId: tNamed,
  }, 'empty-name')

  return { asmId }
}
