export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.box({ id: tplId, name: 'B', length: 40, width: 30, height: 20 })

  // When content IS returned (no file/url)
  const r1 = await api.v1.assembly.exportNode({ id: tplId })
  console.log('[09] data export — result keys:', Object.keys(r1.result || {}))
  console.log('[09] success:', r1.result?.success, 'has content:', 'content' in (r1.result || {}))

  // When content is NOT returned (file given)
  const r2 = await api.v1.assembly.exportNode({ id: tplId, file: '/tmp/cc-test-content.ofb' })
  console.log('[09] file export — result keys:', Object.keys(r2.result || {}))
  console.log('[09] success:', r2.result?.success, 'has content:', 'content' in (r2.result || {}))

  // Test url param (likely fails if no server to receive)
  const r3 = await api.v1.assembly.exportNode({ id: tplId, url: 'http://localhost:12345/receive' })
  console.log('[09] url export — success:', r3.result?.success, 'maxLevel:', r3.maxLevel)
  console.log('[09] url messages:', JSON.stringify(r3.messages))

  filewrite({
    dataExport: { keys: Object.keys(r1.result || {}), hasContent: 'content' in (r1.result || {}) },
    fileExport: { keys: Object.keys(r2.result || {}), hasContent: 'content' in (r2.result || {}) },
    urlExport: { success: r3.result?.success, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'content-behavior')

  return {}
}
