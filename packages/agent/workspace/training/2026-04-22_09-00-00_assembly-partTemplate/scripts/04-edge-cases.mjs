export default async function (api, { filewrite }) {
  // Test: partTemplate BEFORE assembly.create
  console.log('[04] === Test: partTemplate without assembly ===')
  const noAsm = await api.v1.assembly.partTemplate({ name: 'ShouldFail' })
  console.log('[04] no-asm result:', noAsm.result, 'maxLevel:', noAsm.maxLevel)
  console.log('[04] no-asm messages:', JSON.stringify(noAsm.messages))
  filewrite({ result: noAsm.result, messages: noAsm.messages, maxLevel: noAsm.maxLevel }, 'no-asm-response')

  // Now create assembly
  const asmId = (await api.v1.assembly.create({ name: 'EdgeAsm' })).result
  console.log('[04] asmId:', asmId)

  // Test: empty name
  console.log('[04] === Test: empty name ===')
  const emptyName = await api.v1.assembly.partTemplate({ name: '' })
  console.log('[04] empty-name result:', emptyName.result, 'maxLevel:', emptyName.maxLevel)
  const emptyNode = emptyName.structure?.tree?.[String(emptyName.result)]
  console.log('[04] empty-name actual name:', JSON.stringify(emptyNode?.name))

  // Test: special characters
  console.log('[04] === Test: special characters ===')
  const special = await api.v1.assembly.partTemplate({ name: 'Part (v2)/test' })
  console.log('[04] special result:', special.result, 'maxLevel:', special.maxLevel)
  const specialNode = special.structure?.tree?.[String(special.result)]
  console.log('[04] special actual name:', JSON.stringify(specialNode?.name))
  console.log('[04] special originalName:', JSON.stringify(specialNode?.members?.originalName?.value))

  // Test: very long name
  console.log('[04] === Test: long name ===')
  const longName = await api.v1.assembly.partTemplate({ name: 'A'.repeat(200) })
  console.log('[04] longName result:', longName.result, 'maxLevel:', longName.maxLevel)
  const longNode = longName.structure?.tree?.[String(longName.result)]
  console.log('[04] longName actual name length:', longNode?.name?.length)

  return { asmId }
}
