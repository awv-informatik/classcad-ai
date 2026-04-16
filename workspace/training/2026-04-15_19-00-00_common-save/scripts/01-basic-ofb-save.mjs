// Test basic common.save with default OFB format — no encoding, no compression
export default async function (api, { snapshot, filewrite }) {
  // Create a part with a simple box for content
  const partId = (await api.v1.part.create({ name: 'SaveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before-save')

  // Save with defaults (OFB, no encoding, no compression)
  const r = await api.v1.common.save({ format: 'OFB' })
  console.log('[01] save result keys:', Object.keys(r.result))
  console.log('[01] success:', r.result.success)
  console.log('[01] content type:', typeof r.result.content)
  console.log('[01] content length:', r.result.content?.length)
  console.log('[01] content first 200 chars:', r.result.content?.substring(0, 200))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', r.messages)

  filewrite({ result: r.result.success, contentType: typeof r.result.content, contentLength: r.result.content?.length, maxLevel: r.maxLevel, messages: r.messages, contentPreview: r.result.content?.substring(0, 500) }, 'save-result')

  return { partId }
}
