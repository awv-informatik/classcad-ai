// Validate that base64 output is valid base64 and can be decoded in JS
// Also check: what does raw OFB content look like vs base64-encoded OFB?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'B64Validate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save raw and base64
  const raw = await api.v1.common.save({ format: 'OFB' })
  const b64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const both = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

  const rawContent = raw.result.content
  const b64Content = b64.result.content
  const bothContent = both.result.content

  // Check base64 alphabet (A-Z, a-z, 0-9, +, /, =)
  const b64Regex = /^[A-Za-z0-9+/=]+$/
  console.log('[08] b64-only is valid base64:', b64Regex.test(b64Content))
  console.log('[08] both is valid base64:', b64Regex.test(bothContent))

  // Decode base64 in Node.js and compare to raw
  const decoded = Buffer.from(b64Content, 'base64').toString('utf-8')
  console.log('[08] decoded b64 length:', decoded.length)
  console.log('[08] raw length:', rawContent.length)
  console.log('[08] decoded matches raw:', decoded === rawContent)
  console.log('[08] decoded first 80 chars:', decoded.substring(0, 80))
  console.log('[08] raw first 80 chars:', rawContent.substring(0, 80))

  // Decode the deflate+base64 content
  const { inflateSync } = await import('node:zlib')
  const compressedBuf = Buffer.from(bothContent, 'base64')
  console.log('[08] compressed buffer length:', compressedBuf.length)
  try {
    const inflated = inflateSync(compressedBuf)
    console.log('[08] inflated length:', inflated.length)
    const inflatedStr = inflated.toString('utf-8')
    console.log('[08] inflated first 80 chars:', inflatedStr.substring(0, 80))
    console.log('[08] inflated matches raw:', inflatedStr === rawContent)

    filewrite({
      rawLen: rawContent.length,
      b64Len: b64Content.length,
      b64Valid: b64Regex.test(b64Content),
      decodedLen: decoded.length,
      decodedMatchesRaw: decoded === rawContent,
      compressedBufLen: compressedBuf.length,
      inflatedLen: inflated.length,
      inflatedMatchesRaw: inflatedStr === rawContent,
      bothLen: bothContent.length,
      bothValid: b64Regex.test(bothContent),
      overheadRatio: (b64Content.length / rawContent.length).toFixed(3),
      compressionRatio: (bothContent.length / rawContent.length).toFixed(3),
      deflateRawRatio: (compressedBuf.length / rawContent.length).toFixed(3),
    }, 'b64-validation')
  } catch (e) {
    console.log('[08] inflate error:', e.message)
    filewrite({ inflateError: e.message }, 'b64-validation')
  }

  return { partId }
}
