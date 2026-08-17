export default async function (api, { filewrite }) {
  // What happens if you pass the same ID twice in the array?
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[17] created:', inst1, inst2)

  // Pass inst1 twice
  const r = await api.v1.assembly.deleteInstance({ ids: [inst1, inst1] })
  console.log('[17] duplicate id delete result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'duplicate-ids-response')

  const after = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[17] after:', after)
  console.log('[17] inst1 deleted:', !after.includes(inst1))
  console.log('[17] inst2 survives:', after.includes(inst2))

  return { asmId }
}
