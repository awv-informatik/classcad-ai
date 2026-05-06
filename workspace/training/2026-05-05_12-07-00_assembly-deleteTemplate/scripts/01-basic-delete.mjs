export default async function (api, { snapshot, filewrite }) {
  // Create assembly with two part templates
  const asmId = (await api.v1.assembly.create({ name: 'DeleteTest' })).result
  console.log('[01] asmId:', asmId)

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  await api.v1.part.box({ id: tpl1, name: 'BoxA', length: 40, width: 30, height: 20 })
  console.log('[01] tpl1 (PartA):', tpl1)

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'PartB' })).result
  await api.v1.part.box({ id: tpl2, name: 'BoxB', length: 60, width: 20, height: 50 })
  console.log('[01] tpl2 (PartB):', tpl2)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Delete template 1
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[01] deleteTemplate result:', r.result)
  console.log('[01] deleteTemplate maxLevel:', r.maxLevel)
  console.log('[01] deleteTemplate messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-result')

  // Check remaining templates
  const remaining = await api.v1.assembly.getPartTemplate({})
  console.log('[01] remaining templates:', JSON.stringify(remaining.result))
  filewrite(remaining.result, 'remaining-templates')

  return { asmId, tpl1, tpl2, deleteResult: r.result }
}
