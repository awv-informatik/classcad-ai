export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'InstDeleteTest' })).result

  // Create a part template with geometry
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })

  // Switch back to assembly, create instances
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Box_1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl1,
    ownerId: asmId,
    name: 'Box_2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[03] tpl1:', tpl1, 'inst1:', inst1, 'inst2:', inst2)

  await snapshot('before-delete')

  // Try to delete template that has active instances
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl1] })
  console.log('[03] deleteTemplate result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-instanced-result')

  // Check if template still exists
  const tplAfter = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[03] templates after:', JSON.stringify(tplAfter))

  // Check structure to see what happened to instances
  filewrite(r.structure, 'structure-after-delete')

  await snapshot('after-delete')

  return { asmId }
}
