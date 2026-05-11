export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'Box1', length: 80, width: 60, height: 40 })

  // Export with base64 encoding only
  const r1 = await api.v1.assembly.exportNode({ id: tplId, format: 'OFB', encoding: 'base64' })
  console.log('[03] base64 only — success:', r1.result?.success, 'maxLevel:', r1.maxLevel)
  console.log('[03] content length:', r1.result?.content?.length)
  console.log('[03] content preview:', r1.result?.content?.substring(0, 80))
  const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(r1.result?.content?.substring(0, 100)?.replace(/\s/g, ''))
  console.log('[03] looks like base64:', isBase64)

  // Export with deflate compression only
  const r2 = await api.v1.assembly.exportNode({ id: tplId, format: 'OFB', compression: 'deflate' })
  console.log('[03] deflate only — success:', r2.result?.success, 'maxLevel:', r2.maxLevel)
  console.log('[03] deflate content length:', r2.result?.content?.length)
  console.log('[03] deflate content preview:', r2.result?.content?.substring(0, 80))

  // Export with both base64 + deflate
  const r3 = await api.v1.assembly.exportNode({ id: tplId, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[03] base64+deflate — success:', r3.result?.success, 'maxLevel:', r3.maxLevel)
  console.log('[03] combined content length:', r3.result?.content?.length)
  console.log('[03] combined content preview:', r3.result?.content?.substring(0, 80))

  filewrite({
    rawLength: (await api.v1.assembly.exportNode({ id: tplId })).result?.content?.length,
    base64Length: r1.result?.content?.length,
    deflateLength: r2.result?.content?.length,
    base64DeflateLength: r3.result?.content?.length,
  }, 'size-comparison')

  return { asmId, tplId }
}
