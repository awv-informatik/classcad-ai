export default async function (api, { snapshot, filewrite }) {
  // Focused test: does deleteTemplate({ ids: [asmRootId] }) corrupt state?
  const asmId = (await api.v1.assembly.create({ name: 'AsmRootDel' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Prt' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 30, width: 30, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
  console.log('[08] asmId:', asmId, 'tplId:', tplId, 'instId:', instId)

  // Verify state before
  const instsBefore = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] instances before:', JSON.stringify(instsBefore.result))

  // Now try deleteTemplate with asmId
  const r = await api.v1.assembly.deleteTemplate({ ids: [asmId] })
  console.log('[08] deleteTemplate(asmId) - result:', r.result, 'maxLevel:', r.maxLevel)

  // Check state after - does the assembly still work?
  const instsAfter = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[08] instances after:', JSON.stringify(instsAfter.result), 'maxLevel:', instsAfter.maxLevel)

  const tplsAfter = await api.v1.assembly.getPartTemplate({})
  console.log('[08] templates after:', JSON.stringify(tplsAfter.result))

  // Can we still create instances?
  const inst2 = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst2' })
  console.log('[08] create new instance after - result:', inst2.result, 'maxLevel:', inst2.maxLevel)

  // Can we still do a snapshot?
  await snapshot('after-asmroot-delete')

  filewrite({
    before: { instances: instsBefore.result },
    deleteResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    after: {
      instances: instsAfter.result,
      instancesMaxLevel: instsAfter.maxLevel,
      templates: tplsAfter.result,
      newInstance: { result: inst2.result, maxLevel: inst2.maxLevel },
    },
  }, 'asmroot-delete-effect')

  return { asmId, tplId, instId }
}
