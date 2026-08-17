export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'A', ident: 'my_block_a',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B', ident: 'my_block_b',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[06] inst1:', inst1, 'inst2:', inst2)

  const beforeList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[06] before:', beforeList)

  // Delete by ident string
  const r = await api.v1.assembly.deleteInstance({ ids: ['my_block_a'] })
  console.log('[06] delete by ident result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ident-delete-response')

  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[06] after:', afterList)
  console.log('[06] inst2 survived:', afterList.includes(inst2))

  return { asmId }
}
