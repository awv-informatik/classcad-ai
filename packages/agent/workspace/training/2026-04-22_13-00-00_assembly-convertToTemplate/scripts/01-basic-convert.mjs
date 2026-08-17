export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RootAsm' })).result
  console.log('[01] asmId:', asmId)

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  console.log('[01] partTemplate id:', tplId)
  await api.v1.part.box({ id: tplId, length: 60, width: 40, height: 30 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Box1' })).result
  console.log('[01] instance id:', instId)

  await snapshot('before-convert')

  // Capture structure before via a lightweight API call
  const beforeR = await api.v1.common.getAppVersion({})
  filewrite({
    root: beforeR.structure?.root,
    currentProduct: beforeR.structure?.currentProduct,
    currentInstance: beforeR.structure?.currentInstance,
  }, 'structure-before')

  // Convert to template — no params (default name "Subassembly")
  const r = await api.v1.assembly.convertToTemplate()
  console.log('[01] convertToTemplate result:', r.result)
  console.log('[01] convertToTemplate maxLevel:', r.maxLevel)
  console.log('[01] convertToTemplate messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'convert-response')

  // Capture structure after
  filewrite({
    root: r.structure?.root,
    currentProduct: r.structure?.currentProduct,
    currentInstance: r.structure?.currentInstance,
  }, 'structure-after')

  // Dump full structure tree for detailed inspection
  filewrite(r.structure, 'full-structure-after')

  await snapshot('after-convert')

  return { asmId, tplId, instId }
}
