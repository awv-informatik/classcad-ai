export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'ErrorTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'P1' })).result
  await api.v1.part.box({ id: tpl1, name: 'B', length: 20, width: 20, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result

  const groupId = (await api.v1.assembly.group({
    id: asmId, name: 'ErrGroup', instanceIds: [inst1],
  })).result
  console.log('[07] groupId:', groupId)

  // Error 1: updateGroup with assembly ID instead of group ID
  const r1 = await api.v1.assembly.updateGroup({
    id: asmId, name: 'BadUpdate',
  })
  console.log('[07] updateGroup with asmId — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07] messages:', JSON.stringify(r1.messages))

  // Error 2: updateGroup with instance ID
  const r2 = await api.v1.assembly.updateGroup({
    id: inst1, name: 'BadUpdate2',
  })
  console.log('[07] updateGroup with instId — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] messages:', JSON.stringify(r2.messages))

  // Error 3: updateGroup with nonexistent ID
  const r3 = await api.v1.assembly.updateGroup({
    id: 99999, name: 'BadUpdate3',
  })
  console.log('[07] updateGroup with badId — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] messages:', JSON.stringify(r3.messages))

  // Error 4: group with non-instance IDs (e.g., template ID, constraint ID)
  const r4 = await api.v1.assembly.group({
    id: asmId, name: 'TplGroup', instanceIds: [tpl1],
  })
  console.log('[07] group with template ID — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[07] messages:', JSON.stringify(r4.messages))

  // Error 5: group with group ID in instanceIds
  const r5 = await api.v1.assembly.group({
    id: asmId, name: 'GroupOfGroup', instanceIds: [groupId],
  })
  console.log('[07] group containing group — result:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[07] messages:', JSON.stringify(r5.messages))

  // Error 6: group with wrong assembly ID (use instance ID instead)
  const r6 = await api.v1.assembly.group({
    id: inst1, name: 'WrongAsmId', instanceIds: [inst1],
  })
  console.log('[07] group with instId as assembly — result:', r6.result, 'maxLevel:', r6.maxLevel)
  if (r6.messages?.length) console.log('[07] messages:', JSON.stringify(r6.messages))

  filewrite({
    updateWithAsmId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    updateWithInstId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    updateWithBadId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    groupWithTplId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    groupOfGroup: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    groupWithWrongAsm: { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'errors')

  return { asmId }
}
