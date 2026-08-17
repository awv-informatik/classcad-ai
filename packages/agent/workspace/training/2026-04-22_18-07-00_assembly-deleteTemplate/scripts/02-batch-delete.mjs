export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchDeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 20, width: 20, height: 20 })
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.cylinder({ id: tpl2, height: 20, diameter: 15 })
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Part3' })).result
  await api.v1.part.sphere({ id: tpl3, radius: 10 })
  console.log('[02] templates:', tpl1, tpl2, tpl3)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const before = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[02] before:', JSON.stringify(before))

  // Delete all three in one call
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1, tpl2, tpl3] })
  console.log('[02] batch delete result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-delete')

  const after = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[02] after:', JSON.stringify(after))
  filewrite({ before, after }, 'batch-comparison')

  return { asmId }
}
