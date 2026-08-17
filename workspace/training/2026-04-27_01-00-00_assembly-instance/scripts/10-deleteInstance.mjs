export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DelAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Chip' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 15, width: 15, height: 5 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const i1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'C1' })).result
  const i2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'C2', transformation: [[20, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const i3 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'C3', transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
  const i4 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'C4', transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  const before = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[10] before delete:', before)

  // Delete single instance
  const rDel1 = await api.v1.assembly.deleteInstance({ ids: [i2] })
  console.log('[10] delete C2 result:', rDel1.result, 'maxLevel:', rDel1.maxLevel)

  const afterOne = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[10] after deleting C2:', afterOne)

  // Delete multiple at once
  const rDel2 = await api.v1.assembly.deleteInstance({ ids: [i1, i4] })
  console.log('[10] delete C1+C4 result:', rDel2.result, 'maxLevel:', rDel2.maxLevel)

  const afterMulti = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[10] after deleting C1+C4:', afterMulti)

  // Delete already-deleted instance (should error)
  const rDelBad = await api.v1.assembly.deleteInstance({ ids: [i2] })
  console.log('[10] re-delete C2:', rDelBad.result, 'maxLevel:', rDelBad.maxLevel)
  if (rDelBad.messages?.length) console.log('[10]   msg:', rDelBad.messages[0].message)

  // Delete with empty array
  const rDelEmpty = await api.v1.assembly.deleteInstance({ ids: [] })
  console.log('[10] empty ids:', rDelEmpty.result, 'maxLevel:', rDelEmpty.maxLevel)

  // Delete non-instance ID (part template)
  const rDelWrong = await api.v1.assembly.deleteInstance({ ids: [tplId] })
  console.log('[10] delete part tpl:', rDelWrong.result, 'maxLevel:', rDelWrong.maxLevel)
  if (rDelWrong.messages?.length) console.log('[10]   msg:', rDelWrong.messages[0].message)

  filewrite({
    before, afterOne, afterMulti,
    reDelete: { result: rDelBad.result, msg: rDelBad.messages?.[0]?.message },
    emptyIds: { result: rDelEmpty.result, maxLevel: rDelEmpty.maxLevel },
    wrongType: { result: rDelWrong.result, msg: rDelWrong.messages?.[0]?.message },
  }, 'deleteInstance-results')

  await snapshot('after-delete')
  return { asmId }
}
