export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'InvalidIdTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: nonexistent ID
  const r1 = await api.v1.assembly.deleteTemplate({ ids: [999999] })
  console.log('[04] nonexistent ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'nonexistent-id')

  // Test 2: assembly root ID (not a template)
  const r2 = await api.v1.assembly.deleteTemplate({ ids: [asmId] })
  console.log('[04] asmId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'asm-root-id')

  // Test 3: ID 0
  const r3 = await api.v1.assembly.deleteTemplate({ ids: [0] })
  console.log('[04] id=0 result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[04] messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'id-zero')

  // Verify template still exists
  const after = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[04] templates after invalid deletes:', JSON.stringify(after))

  return { asmId }
}
