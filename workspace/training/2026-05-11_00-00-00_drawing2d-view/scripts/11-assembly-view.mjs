export default async function (api, { snapshot, filewrite }) {
  // Build assembly with geometry
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'I1' })).result
  console.log('[11] asmId:', asmId, 'tplId:', tplId, 'inst1:', inst1)

  // Try view on the part template directly
  const r1 = await api.v1.drawing2d.view({ id: tplId, types: ['TOP', 'FRONT'] })
  console.log('[11] template view result:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  if (r1.messages.length > 0) {
    console.log('[11] template messages:', JSON.stringify(r1.messages))
  }

  // Try view on assembly root again (after setCurrentProduct to asm)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const r2 = await api.v1.drawing2d.view({ id: asmId, types: ['TOP', 'FRONT'] })
  console.log('[11] asm root view result:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) {
    console.log('[11] asm root messages:', JSON.stringify(r2.messages))
  }

  // Try with instance ID
  const r3 = await api.v1.drawing2d.view({ id: inst1, types: ['TOP'] })
  console.log('[11] instance view result:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages.length > 0) {
    console.log('[11] instance messages:', JSON.stringify(r3.messages))
  }

  filewrite({
    templateView: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    asmRootView: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    instanceView: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'assembly-view-tests')

  return { asmId, tplId, inst1 }
}
