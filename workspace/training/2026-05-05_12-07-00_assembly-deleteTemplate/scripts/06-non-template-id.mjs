export default async function (api, { snapshot, filewrite }) {
  // Investigate: passing non-template IDs (assembly root, instance, etc.)
  const asmId = (await api.v1.assembly.create({ name: 'NonTplTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'TestPart' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 30, width: 30, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
  console.log('[06] asmId:', asmId, 'tplId:', tplId, 'instId:', instId)

  // Try deleting the assembly root (is it silently ignored or actually deleted?)
  const r1 = await api.v1.assembly.deleteTemplate({ ids: [asmId] })
  console.log('[06] delete asmId - result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Check if assembly still works
  const tpls = await api.v1.assembly.getPartTemplate({})
  console.log('[06] templates after deleting asmId:', JSON.stringify(tpls.result))
  const insts = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[06] instances after deleting asmId:', JSON.stringify(insts.result))

  // Try deleting an instance ID
  const r2 = await api.v1.assembly.deleteTemplate({ ids: [instId] })
  console.log('[06] delete instId - result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Check if instance still exists
  const insts2 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[06] instances after deleting instId:', JSON.stringify(insts2.result))

  filewrite({
    deleteAsmRoot: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    deleteInstance: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    templatesAfterAsmDelete: tpls.result,
    instancesAfterAsmDelete: insts.result,
    instancesAfterInstDelete: insts2.result,
  }, 'non-template-id-results')

  return { asmId, tplId, instId }
}
