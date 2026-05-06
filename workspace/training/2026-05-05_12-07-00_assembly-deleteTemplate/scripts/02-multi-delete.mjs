export default async function (api, { snapshot, filewrite }) {
  // Create assembly with three part templates
  const asmId = (await api.v1.assembly.create({ name: 'MultiDeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'A' })).result
  await api.v1.part.box({ id: tpl1, name: 'BoxA', length: 30, width: 30, height: 30 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'B' })).result
  await api.v1.part.box({ id: tpl2, name: 'BoxB', length: 50, width: 20, height: 40 })

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'C' })).result
  await api.v1.part.box({ id: tpl3, name: 'BoxC', length: 20, width: 60, height: 10 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[02] templates created:', tpl1, tpl2, tpl3)

  // Verify all three exist
  const before = await api.v1.assembly.getPartTemplate({})
  console.log('[02] before delete:', JSON.stringify(before.result))

  // Delete two at once
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1, tpl3] })
  console.log('[02] multi-delete result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-delete-result')

  // Verify only tpl2 remains
  const after = await api.v1.assembly.getPartTemplate({})
  console.log('[02] after delete:', JSON.stringify(after.result))
  filewrite({ before: before.result, after: after.result }, 'templates-before-after')

  return { asmId, tpl1, tpl2, tpl3 }
}
