export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Alpha' })).result
  console.log('[02] created inst1:', inst1)

  // Name not found
  const rNotFound = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'DoesNotExist' })
  console.log('[02] notFound result:', JSON.stringify(rNotFound.result))
  console.log('[02] notFound maxLevel:', rNotFound.maxLevel)
  console.log('[02] notFound messages:', JSON.stringify(rNotFound.messages))

  // Empty assembly (no instances)
  const asmEmpty = (await api.v1.assembly.create({ name: 'Empty' })).result
  const rEmpty = await api.v1.assembly.getInstance({ ownerId: asmEmpty })
  console.log('[02] emptyAsm result:', JSON.stringify(rEmpty.result))
  console.log('[02] emptyAsm maxLevel:', rEmpty.maxLevel)

  // Invalid owner (part template)
  const rPartTpl = await api.v1.assembly.getInstance({ ownerId: tplId })
  console.log('[02] partTpl result:', JSON.stringify(rPartTpl.result))
  console.log('[02] partTpl maxLevel:', rPartTpl.maxLevel)
  console.log('[02] partTpl messages:', JSON.stringify(rPartTpl.messages))

  // Nonexistent ID
  const rBadId = await api.v1.assembly.getInstance({ ownerId: 99999 })
  console.log('[02] badId result:', JSON.stringify(rBadId.result))
  console.log('[02] badId maxLevel:', rBadId.maxLevel)
  console.log('[02] badId messages:', JSON.stringify(rBadId.messages))

  filewrite({
    notFound: { result: rNotFound.result, maxLevel: rNotFound.maxLevel, messages: rNotFound.messages },
    emptyAsm: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
    partTpl: { result: rPartTpl.result, maxLevel: rPartTpl.maxLevel, messages: rPartTpl.messages },
    badId: { result: rBadId.result, maxLevel: rBadId.maxLevel, messages: rBadId.messages },
  }, 'edge-cases')

  return { asmId }
}
