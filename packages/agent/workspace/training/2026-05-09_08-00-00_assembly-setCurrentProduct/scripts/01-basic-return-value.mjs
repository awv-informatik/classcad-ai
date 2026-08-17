export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a part template
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[01] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  console.log('[01] tplId:', tplId)

  // Build geometry in the template
  const boxFeat = (await api.v1.part.box({ id: tplId, length: 40, width: 30, height: 20 })).result
  console.log('[01] boxFeat:', boxFeat)

  // Switch back to assembly — check return value (should be previous product)
  const r1 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[01] setCurrentProduct(asmId) result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'switch-to-asm')

  // Switch to part template — return value should be assembly ID
  const r2 = await api.v1.assembly.setCurrentProduct({ id: tplId })
  console.log('[01] setCurrentProduct(tplId) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'switch-to-tpl')

  // Switch back to assembly — return value should be template ID
  const r3 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[01] setCurrentProduct(asmId) again result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'switch-back')

  // Create an instance for the snapshot
  const instId = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[01] instId:', instId)

  await snapshot('basic')
  return { asmId, tplId, boxFeat, instId }
}
