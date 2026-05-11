export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'Box1', length: 80, width: 60, height: 40 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const instId = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  // Export template as STP
  const r1 = await api.v1.assembly.exportNode({ id: tplId, format: 'STP' })
  console.log('[02] export template STP — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[02] content length:', r1.result?.content?.length)
  console.log('[02] content preview (first 120 chars):', r1.result?.content?.substring(0, 120))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'export-template-stp')

  // Export instance as STP
  const r2 = await api.v1.assembly.exportNode({ id: instId, format: 'STP' })
  console.log('[02] export instance STP — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[02] instance content length:', r2.result?.content?.length)

  return { asmId, tplId, instId }
}
