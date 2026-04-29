export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdentLookupAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Piece' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance with ident during creation
  const r1 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'WithIdent',
    ident: 'piece_alpha',
  })
  console.log('[13] instance with ident:', r1.result)

  // Try using ident as productId for a new instance (should not work — ident is per-instance)
  // Actually, docs say productId accepts "id or identifier"
  // Let's set ident on the TEMPLATE and see if we can use it as productId
  await api.v1.assembly.setIdent({ id: tplId, ident: 'tpl_piece' })

  const r2 = await api.v1.assembly.instance({
    productId: 'tpl_piece', ownerId: asmId, name: 'ViaTemplateIdent',
  })
  console.log('[13] instance via template ident:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[13]   msg:', r2.messages[0].message)

  // Use instance ident as ownerId (should not work — ident is on a part instance, not assembly)
  // But let's try using ident to reference in deleteInstance
  const r3 = await api.v1.assembly.deleteInstance({ ids: ['piece_alpha'] })
  console.log('[13] delete by ident:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[13]   msg:', r3.messages[0].message)

  // Check if it was actually deleted
  const remaining = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[13] remaining instances:', remaining)

  // Set ident on root assembly and use as ownerId
  await api.v1.assembly.setIdent({ id: asmId, ident: 'root_asm' })
  const r4 = await api.v1.assembly.instance({
    productId: tplId, ownerId: 'root_asm', name: 'ViaAsmIdent',
  })
  console.log('[13] instance via asm ident as ownerId:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    withIdent: { result: r1.result },
    viaTemplateIdent: { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message },
    deleteByIdent: { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message },
    remaining,
    viaAsmIdent: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'ident-lookup')

  return { asmId }
}
