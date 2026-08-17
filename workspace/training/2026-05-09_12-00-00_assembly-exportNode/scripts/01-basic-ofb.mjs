export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  const partId = tplId
  await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await snapshot('assembly')

  // Export the template as OFB (default format)
  const r1 = await api.v1.assembly.exportNode({ id: tplId })
  console.log('[01] export template OFB — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[01] content type:', typeof r1.result?.content)
  console.log('[01] content length:', r1.result?.content?.length)
  console.log('[01] content preview (first 100 chars):', r1.result?.content?.substring(0, 100))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'export-template-ofb')

  // Export the instance as OFB
  const r2 = await api.v1.assembly.exportNode({ id: instId })
  console.log('[01] export instance OFB — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[01] instance content length:', r2.result?.content?.length)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'export-instance-ofb')

  return { asmId, tplId, instId }
}
