export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[03] asmId:', asmId)

  // Get instances from assembly with no instances yet
  const rEmpty = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[03] empty asm result:', JSON.stringify(rEmpty.result))
  console.log('[03] empty asm maxLevel:', rEmpty.maxLevel)
  console.log('[03] empty asm messages:', JSON.stringify(rEmpty.messages))

  // Now add an instance and try again
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'One' })).result
  console.log('[03] inst1:', inst1)

  // Get all again (should have 1)
  const rOne = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[03] one inst result:', JSON.stringify(rOne.result))
  console.log('[03] one inst maxLevel:', rOne.maxLevel)

  filewrite({
    empty: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
    oneInst: { result: rOne.result, maxLevel: rOne.maxLevel, messages: rOne.messages },
  }, 'empty-vs-populated')

  return { asmId }
}
