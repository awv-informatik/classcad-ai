export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  console.log('[04] created inst1:', inst1)

  // First delete — should succeed
  const r1 = await api.v1.assembly.deleteInstance({ ids: [inst1] })
  console.log('[04] first delete result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Re-delete same ID — should error
  const r2 = await api.v1.assembly.deleteInstance({ ids: [inst1] })
  console.log('[04] re-delete result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 're-delete-response')

  return { asmId }
}
