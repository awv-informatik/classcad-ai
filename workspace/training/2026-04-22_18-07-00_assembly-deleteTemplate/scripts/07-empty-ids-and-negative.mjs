export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'EdgeCaseTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: empty ids array
  const r1 = await api.v1.assembly.deleteTemplate({ ids: [] })
  console.log('[07] empty ids result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-ids')

  // Test 2: instance ID (not a template)
  const inst = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  console.log('[07] inst:', inst)
  const r2 = await api.v1.assembly.deleteTemplate({ ids: [inst] })
  console.log('[07] instance id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'instance-id')

  // Verify nothing unexpected was deleted
  const tplAfter = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[07] templates after:', JSON.stringify(tplAfter))

  return { asmId }
}
