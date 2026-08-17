// Test save with both deflate + base64 — the typical pipeline for data transport
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const raw = await api.v1.common.save({ format: 'OFB' })
  const b64Only = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const deflateOnly = await api.v1.common.save({ format: 'OFB', compression: 'deflate' })
  const both = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

  console.log('[04] raw:', raw.result.content.length)
  console.log('[04] b64 only:', b64Only.result.content.length)
  console.log('[04] deflate only:', deflateOnly.result.content.length)
  console.log('[04] deflate+b64:', both.result.content.length)
  console.log('[04] both success:', both.result.success)
  console.log('[04] both first 100:', both.result.content.substring(0, 100))
  // Per docs: "If compression is also set, the decoding happens after compression"
  // So order is: data → deflate → base64 (for save)
  // And for load: base64-decode → inflate → data

  filewrite({
    rawLength: raw.result.content.length,
    b64OnlyLength: b64Only.result.content.length,
    deflateOnlyLength: deflateOnly.result.content.length,
    bothLength: both.result.content.length,
    bothPreview: both.result.content.substring(0, 200),
  }, 'pipeline-comparison')

  return { partId }
}
