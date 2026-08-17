export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Try deleting the part template ID
  const r1 = await api.v1.assembly.deleteInstance({ ids: [tplId] })
  console.log('[05] delete partTemplate result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-template-response')

  // Try deleting the assembly ID
  const r2 = await api.v1.assembly.deleteInstance({ ids: [asmId] })
  console.log('[05] delete assembly result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'delete-assembly-response')

  // Try deleting a nonexistent ID
  const r3 = await api.v1.assembly.deleteInstance({ ids: [99999] })
  console.log('[05] delete nonexistent result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'delete-nonexistent-response')

  return { asmId }
}
