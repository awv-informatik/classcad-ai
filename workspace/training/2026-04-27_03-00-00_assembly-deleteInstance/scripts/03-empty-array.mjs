export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result

  // Delete with empty array
  const r = await api.v1.assembly.deleteInstance({ ids: [] })
  console.log('[03] empty ids result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-array-response')

  // Verify instance still exists
  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[03] instances after empty delete:', afterList)
  console.log('[03] inst1 still exists:', afterList.includes(inst1))

  return { asmId }
}
