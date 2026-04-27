export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ContextDeleteTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })
  console.log('[06] tpl1:', tpl1)

  // Stay in template context (currentProduct = tpl1) — don't switch back
  // Try to delete the template we're currently editing
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[06] delete current context result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-current')

  // Where is currentProduct now?
  filewrite(r.structure, 'structure-after')
  const cp = r.structure?.currentProduct
  console.log('[06] currentProduct after:', cp)

  // Can we still do assembly operations?
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const tplAfter = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[06] templates after:', JSON.stringify(tplAfter))

  return { asmId }
}
