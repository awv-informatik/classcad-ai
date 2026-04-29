export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'ErrPart' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Error 1: missing productId
  const r1 = await api.v1.assembly.instance({ ownerId: asmId })
  console.log('[02] missing productId — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[02]   msg:', r1.messages[0].message)

  // Error 2: missing ownerId
  const r2 = await api.v1.assembly.instance({ productId: tplId })
  console.log('[02] missing ownerId — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[02]   msg:', r2.messages[0].message)

  // Error 3: productId = nonexistent ID (9999)
  const r3 = await api.v1.assembly.instance({ productId: 9999, ownerId: asmId })
  console.log('[02] invalid productId — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[02]   msg:', r3.messages[0].message)

  // Error 4: ownerId = part template (should only accept assembly/instance)
  const r4 = await api.v1.assembly.instance({ productId: tplId, ownerId: tplId })
  console.log('[02] ownerId=partTemplate — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[02]   msg:', r4.messages[0].message)

  // Error 5: productId = assembly root (can assembly be instanced in itself?)
  const r5 = await api.v1.assembly.instance({ productId: asmId, ownerId: asmId })
  console.log('[02] self-reference — result:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[02]   msg:', r5.messages[0].message)

  // Error 6: both missing
  const r6 = await api.v1.assembly.instance({})
  console.log('[02] empty params — result:', r6.result, 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[02]   msg:', r6.messages[0].message)

  filewrite({
    missingProductId: { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message },
    missingOwnerId: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message },
    invalidProductId: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message },
    ownerIsPartTpl: { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message },
    selfReference: { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message },
    emptyParams: { result: r6.result, maxLevel: r6.maxLevel, msg: r6.messages?.[0]?.message },
  }, 'error-cases')

  return { asmId, tplId }
}
