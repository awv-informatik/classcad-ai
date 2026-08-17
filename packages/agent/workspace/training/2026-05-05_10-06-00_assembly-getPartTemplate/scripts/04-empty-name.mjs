export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  // Create a template with empty-string name
  const tpl1 = (await api.v1.assembly.partTemplate({ name: '' })).result
  // Create one with a real name
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Named' })).result

  const rEmpty = await api.v1.assembly.getPartTemplate({ name: '' })
  const rNamed = await api.v1.assembly.getPartTemplate({ name: 'Named' })
  const rAll = await api.v1.assembly.getPartTemplate()

  console.log('[04] empty-name tpl:', tpl1, 'named tpl:', tpl2)
  console.log('[04] lookup empty:', rEmpty.result, 'maxLevel:', rEmpty.maxLevel)
  console.log('[04] lookup Named:', rNamed.result, 'maxLevel:', rNamed.maxLevel)
  console.log('[04] all:', JSON.stringify(rAll.result))

  filewrite({
    tplIds: { tpl1, tpl2 },
    emptyLookup: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
    namedLookup: { result: rNamed.result, maxLevel: rNamed.maxLevel },
    listAll: { result: rAll.result },
  }, 'empty-name-results')

  return { asmId }
}
