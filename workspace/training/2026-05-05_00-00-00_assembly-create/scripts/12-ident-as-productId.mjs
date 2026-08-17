export default async function (api, { filewrite }) {
  // Test: can ident string be used as productId in instance()?
  const asmId = (await api.v1.assembly.create({ name: 'IdentUse' })).result
  console.log('[12] asmId:', asmId)

  // Create a part template with a custom ident
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  console.log('[12] tplId:', tplId)

  // Build geometry
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 30, width: 20, height: 15 })).result
  console.log('[12] boxId:', boxId)

  // Return to assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Try using the template name as productId (string identifier)
  const r1 = await api.v1.assembly.instance({ productId: 'Bracket', ownerId: asmId, name: 'ByName' })
  console.log('[12] instance by name result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[12] instance by name messages:', JSON.stringify(r1.messages))

  // Try using the numeric ID
  const r2 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'ById' })
  console.log('[12] instance by id result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    byName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    byId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'ident-as-productid')

  return { asmId, tplId }
}
