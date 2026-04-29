export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[09] created:', inst1, inst2)

  // Mix valid instance ID with invalid (nonexistent) ID
  const r = await api.v1.assembly.deleteInstance({ ids: [inst1, 99999] })
  console.log('[09] partial failure result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'partial-failure-response')

  // Check: did inst1 get deleted despite the error, or did the whole call fail?
  const afterList = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[09] after partial failure, instances:', afterList)
  console.log('[09] inst1 deleted?', !afterList.includes(inst1))
  console.log('[09] inst2 survives?', afterList.includes(inst2))

  filewrite({ before: [inst1, inst2], after: afterList }, 'partial-failure-comparison')

  return { asmId }
}
