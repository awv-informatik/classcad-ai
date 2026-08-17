// Test encoding/compression pipeline with STL format
// STL is binary by default — MUST use base64 for data-string transport
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STLPipeline' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // STL: raw (binary — should be truncated/corrupt), base64, deflate+base64
  const raw = await api.v1.common.save({ format: 'STL' })
  const b64 = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  const both = await api.v1.common.save({ format: 'STL', encoding: 'base64', compression: 'deflate' })

  console.log('[11] STL raw: len=', raw.result.content?.length, 'first 40:', JSON.stringify(raw.result.content?.substring(0, 40)))
  console.log('[11] STL b64: len=', b64.result.content?.length)
  console.log('[11] STL both: len=', both.result.content?.length)

  // Check raw STL — is it truly corrupted?
  const rawContent = raw.result.content || ''
  let nonPrintable = 0
  for (let i = 0; i < rawContent.length; i++) {
    const code = rawContent.charCodeAt(i)
    if (code < 32 && code !== 10 && code !== 13 && code !== 9) nonPrintable++
    if (code > 126) nonPrintable++
  }
  console.log('[11] STL raw non-printable:', nonPrintable, '/', rawContent.length)

  // Decode base64 STL and inspect binary content
  const stlBuf = Buffer.from(b64.result.content, 'base64')
  console.log('[11] STL decoded buffer length:', stlBuf.length)
  console.log('[11] STL header (first 80 bytes):', stlBuf.subarray(0, 80).toString('ascii').replace(/\0/g, '\\0'))
  // STL binary: 80-byte header, 4-byte triangle count, then 50 bytes per triangle
  const triCount = stlBuf.readUInt32LE(80)
  console.log('[11] STL triangle count:', triCount)
  console.log('[11] Expected binary size:', 80 + 4 + triCount * 50, 'actual:', stlBuf.length)

  // Inflate the compressed version
  const { inflateRawSync } = await import('node:zlib')
  const compBuf = Buffer.from(both.result.content, 'base64')
  try {
    const inflated = inflateRawSync(compBuf)
    console.log('[11] STL inflated length:', inflated.length, '(decoded b64 was', stlBuf.length, ')')
    console.log('[11] STL inflated matches decoded b64:', Buffer.compare(inflated, stlBuf) === 0)
  } catch (e) {
    console.log('[11] STL inflate error:', e.message)
  }

  filewrite({
    rawLen: rawContent.length,
    b64Len: b64.result.content?.length,
    bothLen: both.result.content?.length,
    rawNonPrintable: nonPrintable,
    decodedBufLen: stlBuf.length,
    triangleCount: triCount,
    expectedBinarySize: 80 + 4 + triCount * 50,
    compressionRatio: (both.result.content.length / b64.result.content.length).toFixed(3),
  }, 'stl-pipeline')

  return { partId }
}
