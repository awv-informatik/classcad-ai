// Test all 4 encoding/compression combinations on OFB save
// No encoding/compression, base64-only, deflate-only, both
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EncTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // 1. Raw (no encoding, no compression)
  const raw = await api.v1.common.save({ format: 'OFB' })
  console.log('[01] raw: success=', raw.result.success, 'len=', raw.result.content?.length)
  console.log('[01] raw first 120 chars:', raw.result.content?.substring(0, 120))

  // 2. Base64 only (no compression)
  const b64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[01] b64: success=', b64.result.success, 'len=', b64.result.content?.length)
  console.log('[01] b64 first 120 chars:', b64.result.content?.substring(0, 120))

  // 3. Deflate only (no base64) — expected to be corrupted binary
  const def = await api.v1.common.save({ format: 'OFB', compression: 'deflate' })
  console.log('[01] deflate-only: success=', def.result.success, 'len=', def.result.content?.length)
  console.log('[01] deflate-only first 120 chars:', def.result.content?.substring(0, 120))

  // 4. Both deflate + base64
  const both = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[01] both: success=', both.result.success, 'len=', both.result.content?.length)
  console.log('[01] both first 120 chars:', both.result.content?.substring(0, 120))

  // Summary
  const summary = {
    raw: { len: raw.result.content?.length, success: raw.result.success },
    base64Only: { len: b64.result.content?.length, success: b64.result.success },
    deflateOnly: { len: def.result.content?.length, success: def.result.success },
    both: { len: both.result.content?.length, success: both.result.success },
  }
  console.log('[01] SUMMARY:', JSON.stringify(summary))

  filewrite(summary, 'size-summary')

  return { partId }
}
