export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'MyBlock' })).result
  console.log('[13] inst1:', inst1)

  // Try deleting by instance name string (not ident)
  const r = await api.v1.assembly.deleteInstance({ ids: ['MyBlock'] })
  console.log('[13] delete by name result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'name-delete-response')

  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[13] after delete by name, instances:', afterList)
  console.log('[13] inst1 still exists:', afterList.includes(inst1))

  return { asmId }
}
