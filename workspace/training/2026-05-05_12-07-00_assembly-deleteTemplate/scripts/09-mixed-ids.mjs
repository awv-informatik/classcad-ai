export default async function (api, { snapshot, filewrite }) {
  // Test: mix of valid and invalid IDs in one call
  const asmId = (await api.v1.assembly.create({ name: 'MixedTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Keep' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 30, width: 30, height: 30 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Delete' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 50, width: 20, height: 40 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[09] tpl1:', tpl1, 'tpl2:', tpl2)

  // Pass tpl2 (valid) and 999999 (invalid) together
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl2, 999999] })
  console.log('[09] mixed delete - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] mixed delete - messages:', JSON.stringify(r.messages))

  // Check: was the valid one deleted despite the invalid one causing an error?
  const remaining = await api.v1.assembly.getPartTemplate({})
  console.log('[09] remaining templates:', JSON.stringify(remaining.result))

  filewrite({
    deleteResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    remaining: remaining.result,
  }, 'mixed-ids-result')

  return { asmId, tpl1, tpl2 }
}
