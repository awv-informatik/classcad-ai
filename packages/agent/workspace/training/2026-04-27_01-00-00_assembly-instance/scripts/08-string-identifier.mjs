export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'StringIdAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'MySpecialPart' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Try using template name as string identifier for productId
  const r1 = await api.v1.assembly.instance({ productId: 'MySpecialPart', ownerId: asmId, name: 'ByName' })
  console.log('[08] productId by name string:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[08]   msg:', r1.messages[0].message)

  // Try using numeric ID as string
  const r2 = await api.v1.assembly.instance({ productId: String(tplId), ownerId: asmId, name: 'ByIdString' })
  console.log('[08] productId as string number:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[08]   msg:', r2.messages[0].message)

  // ownerId as string name
  const r3 = await api.v1.assembly.instance({ productId: tplId, ownerId: 'StringIdAsm', name: 'ByOwnerName' })
  console.log('[08] ownerId by name string:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[08]   msg:', r3.messages[0].message)

  filewrite({
    byName: { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message },
    byIdString: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message },
    byOwnerName: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message },
  }, 'string-ids')

  return { asmId, tplId }
}
