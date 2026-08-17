export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'MixedTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 30, width: 20, height: 10 })
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.cylinder({ id: tpl2, height: 20, diameter: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[09] tpl1:', tpl1, 'tpl2:', tpl2)

  // Mix valid template ID with invalid ID
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1, 999999] })
  console.log('[09] mixed result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-result')

  // Did the valid one get deleted despite the invalid one?
  const after = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[09] templates after:', JSON.stringify(after))
  filewrite({ after }, 'after-state')

  return { asmId }
}
