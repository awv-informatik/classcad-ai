// Verify the encoding order explicitly
// Doc says save: data → compress → encode; load: decode → decompress → data
// Test by saving with both, decoding base64 manually, then trying to inflate
export default async function (api, { filewrite }) {
  const { inflateRawSync, deflateRawSync } = await import('node:zlib')

  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with both
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const content = saved.result.content

  // Step 1: base64 decode → should get compressed bytes
  const step1 = Buffer.from(content, 'base64')
  console.log('[15] step1 (b64 decode): length=', step1.length)
  console.log('[15] step1 first 4 bytes:', [...step1.subarray(0, 4)].map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))
  console.log('[15] step1 looks like deflate?', step1[0] !== 0x78) // 0x78 = zlib header, not raw

  // Step 2: inflate raw → should get OFB text
  const step2 = inflateRawSync(step1)
  console.log('[15] step2 (inflate): length=', step2.length)
  const text = step2.toString('utf-8')
  console.log('[15] step2 first 40 chars:', text.substring(0, 40))

  // Verify the reverse: take raw, compress, encode
  const rawSave = await api.v1.common.save({ format: 'OFB' })
  const rawContent = rawSave.result.content
  console.log('[15] raw OFB length:', rawContent.length)

  // Raw → deflateRaw → base64
  const compressed = deflateRawSync(Buffer.from(rawContent, 'utf-8'))
  const encoded = compressed.toString('base64')
  console.log('[15] manual compressed length:', compressed.length)
  console.log('[15] manual encoded length:', encoded.length)

  // Verify this manual encoding can be loaded
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({
    data: encoded,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[15] manual encoded load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)

  // Summary
  filewrite({
    pipeline: 'save: data → deflateRaw → base64 | load: base64-decode → inflateRaw → data',
    b64DecodeLen: step1.length,
    inflatedLen: step2.length,
    rawLen: rawContent.length,
    manualCompressedLen: compressed.length,
    manualEncodedLen: encoded.length,
    manualLoadSuccess: !!loaded.result?.id,
    compressionType: 'raw deflate (RFC 1951, no zlib header)',
    nodeJsDecodeApproach: 'Buffer.from(b64, "base64") → inflateRawSync(buf) → toString("utf-8")',
    nodeJsEncodeApproach: 'deflateRawSync(Buffer.from(text, "utf-8")) → toString("base64")',
  }, 'encoding-order')

  return { partId }
}
