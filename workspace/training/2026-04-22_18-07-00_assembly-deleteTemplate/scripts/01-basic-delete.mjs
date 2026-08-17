export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DeleteTest' })).result
  console.log('[01] asmId:', asmId)

  // Create two part templates
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })
  console.log('[01] tpl1:', tpl1)

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tpl2, height: 30, diameter: 20 })
  console.log('[01] tpl2:', tpl2)

  // Switch back to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Check templates exist
  const before = await api.v1.assembly.getPartTemplate({})
  console.log('[01] templates before:', JSON.stringify(before.result))
  filewrite({ templates: before.result, maxLevel: before.maxLevel }, 'before-delete')

  // Delete the first template
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[01] deleteTemplate result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-result')

  // Check templates after
  const after = await api.v1.assembly.getPartTemplate({})
  console.log('[01] templates after:', JSON.stringify(after.result))
  filewrite({ templates: after.result, maxLevel: after.maxLevel }, 'after-delete')

  // Check structure
  filewrite(r.structure, 'structure-after')

  return { asmId, tpl1, tpl2 }
}
