// Test encoding/compression across all formats
// Which formats support deflate+base64? Which need it?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EncodingTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const results = {}

  for (const fmt of ['OFB', 'STP', 'STL', 'SCG', 'IWP']) {
    results[fmt] = {}

    // Raw (no encoding)
    try {
      const r = await api.v1.common.save({ format: fmt })
      results[fmt].raw = { success: r.result?.success, contentLength: r.result?.content?.length || 0 }
      console.log(`[11] ${fmt} raw: len=${r.result?.content?.length || 0}`)
    } catch (e) {
      results[fmt].raw = { error: e.message }
      console.log(`[11] ${fmt} raw: ERROR`)
    }

    // base64 only
    try {
      const r = await api.v1.common.save({ format: fmt, encoding: 'base64' })
      results[fmt].base64 = { success: r.result?.success, contentLength: r.result?.content?.length || 0 }
      console.log(`[11] ${fmt} b64: len=${r.result?.content?.length || 0}`)
    } catch (e) {
      results[fmt].base64 = { error: e.message }
      console.log(`[11] ${fmt} b64: ERROR`)
    }

    // deflate + base64
    try {
      const r = await api.v1.common.save({ format: fmt, encoding: 'base64', compression: 'deflate' })
      results[fmt].deflateBase64 = { success: r.result?.success, contentLength: r.result?.content?.length || 0 }
      console.log(`[11] ${fmt} deflate+b64: len=${r.result?.content?.length || 0}`)
    } catch (e) {
      results[fmt].deflateBase64 = { error: e.message }
      console.log(`[11] ${fmt} deflate+b64: ERROR`)
    }
  }

  filewrite(results, 'encoding-across-formats')
  return { partId }
}
