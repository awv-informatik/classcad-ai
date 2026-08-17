// Test inflating with raw deflate (no zlib header) vs standard zlib
// Also investigate why decoded b64 doesn't exactly match raw content
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InflateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const raw = await api.v1.common.save({ format: 'OFB' })
  const b64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const both = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

  const { inflateSync, inflateRawSync } = await import('node:zlib')

  const rawContent = raw.result.content
  const b64Content = b64.result.content
  const bothContent = both.result.content

  // Investigate b64 decode mismatch
  const decoded = Buffer.from(b64Content, 'base64').toString('utf-8')
  console.log('[09] raw length:', rawContent.length, 'decoded length:', decoded.length)

  // Compare char by char to find first difference
  let firstDiff = -1
  for (let i = 0; i < Math.max(rawContent.length, decoded.length); i++) {
    if (rawContent[i] !== decoded[i]) {
      firstDiff = i
      break
    }
  }
  if (firstDiff >= 0) {
    console.log('[09] first diff at index:', firstDiff)
    console.log('[09] raw[diff]:', rawContent.charCodeAt(firstDiff), `'${rawContent[firstDiff]}'`)
    console.log('[09] decoded[diff]:', decoded.charCodeAt(firstDiff), `'${decoded[firstDiff]}'`)
    console.log('[09] raw around diff:', JSON.stringify(rawContent.substring(Math.max(0, firstDiff - 10), firstDiff + 10)))
    console.log('[09] decoded around diff:', JSON.stringify(decoded.substring(Math.max(0, firstDiff - 10), firstDiff + 10)))
  } else {
    console.log('[09] content matches exactly!')
  }

  // Try raw deflate inflate
  const compressedBuf = Buffer.from(bothContent, 'base64')
  console.log('[09] compressed buffer first 4 bytes:', [...compressedBuf.subarray(0, 4)].map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))

  // Try standard inflate (zlib header)
  try {
    const inflated = inflateSync(compressedBuf)
    console.log('[09] inflateSync succeeded, length:', inflated.length)
  } catch (e) {
    console.log('[09] inflateSync failed:', e.message)
  }

  // Try raw inflate (no zlib header)
  try {
    const inflated = inflateRawSync(compressedBuf)
    console.log('[09] inflateRawSync succeeded, length:', inflated.length)
    const inflatedStr = inflated.toString('utf-8')
    console.log('[09] inflated first 80 chars:', inflatedStr.substring(0, 80))
    console.log('[09] inflated matches raw:', inflatedStr === rawContent)

    filewrite({
      rawLen: rawContent.length,
      compressedBufLen: compressedBuf.length,
      inflatedLen: inflated.length,
      inflatedMatchesRaw: inflatedStr === rawContent,
      trueCompressionRatio: (compressedBuf.length / rawContent.length * 100).toFixed(1) + '%',
      b64OverheadOnCompressed: (bothContent.length / compressedBuf.length).toFixed(3),
      firstDiffIndex: firstDiff,
    }, 'inflate-raw')
  } catch (e) {
    console.log('[09] inflateRawSync failed:', e.message)
    filewrite({ rawInflateError: e.message }, 'inflate-raw')
  }

  return { partId }
}
