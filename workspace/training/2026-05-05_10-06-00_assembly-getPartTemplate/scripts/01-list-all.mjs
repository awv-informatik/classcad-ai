export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Alpha' })).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Beta' })).result
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Gamma' })).result

  const r1 = await api.v1.assembly.getPartTemplate()
  const r2 = await api.v1.assembly.getPartTemplate({})
  const r3 = await api.v1.assembly.getPartTemplate({ name: undefined })

  console.log('[01] tpl IDs:', tpl1, tpl2, tpl3)
  console.log('[01] no-params:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[01] empty-obj:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[01] undef-name:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  console.log('[01] isArray:', Array.isArray(r1.result), Array.isArray(r2.result), Array.isArray(r3.result))

  filewrite({
    createdIds: { tpl1, tpl2, tpl3 },
    noParams: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    emptyObj: { result: r2.result, maxLevel: r2.maxLevel },
    undefName: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'list-all-results')

  return { asmId }
}
