// Verify we can manually encode/decode the pipeline in Node.js
// Prove: deflateRawSync → base64 matches server's output
// Prove: base64 decode → inflateRawSync recovers original data
export default async function (api, { filewrite }) {
  const { deflateRawSync, inflateRawSync } = await import('node:zlib')

  const partId = (await api.v1.part.create({ name: 'ManualEnc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Get raw OFB content
  const raw = await api.v1.common.save({ format: 'OFB' })
  const rawContent = raw.result.content
  console.log('[12] raw OFB length:', rawContent.length)

  // Manual encode: raw → deflateRaw → base64
  const rawBuf = Buffer.from(rawContent, 'utf-8')
  const deflated = deflateRawSync(rawBuf)
  const manualB64 = deflated.toString('base64')
  console.log('[12] manual deflate+b64 length:', manualB64.length)
  console.log('[12] deflated buffer size:', deflated.length)

  // Server encode: get server's version
  const serverBoth = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[12] server deflate+b64 length:', serverBoth.result.content.length)

  // Note: server saves will have different StateId, so sizes won't match exactly
  // But the pipeline process should be identical

  // Manual decode: server's b64 → decode → inflateRaw → text
  const serverB64 = serverBoth.result.content
  const serverCompressed = Buffer.from(serverB64, 'base64')
  const serverInflated = inflateRawSync(serverCompressed)
  const serverText = serverInflated.toString('utf-8')
  console.log('[12] server content decoded length:', serverText.length)
  console.log('[12] starts with classcad:', serverText.startsWith('classcad'))
  console.log('[12] first 60 chars:', serverText.substring(0, 60))

  // Full roundtrip: save raw → deflateRaw → base64 → load (pass to server)
  // Can we construct our own compressed payload?
  await api.v1.common.clear({})
  // Save raw first to get content
  const partId2 = (await api.v1.part.create({ name: 'ManualEnc2' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2 })).result
  await api.v1.solid.sphere({ id: eifId2, radius: 25 })
  const rawSave = await api.v1.common.save({ format: 'OFB' })

  // Manually compress and encode
  const manualCompressed = deflateRawSync(Buffer.from(rawSave.result.content, 'utf-8'))
  const manualEncoded = manualCompressed.toString('base64')
  console.log('[12] manual encoded sphere OFB:', manualEncoded.length, 'chars')

  // Load it back using server's decoder
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({
    data: manualEncoded,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[12] manual-encoded load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)

  filewrite({
    rawLen: rawContent.length,
    manualDeflateB64Len: manualB64.length,
    serverDeflateB64Len: serverBoth.result.content.length,
    serverDecodedLen: serverText.length,
    serverDecodedStartsCorrectly: serverText.startsWith('classcad'),
    manualEncodedSphereLen: manualEncoded.length,
    manualEncodedLoadSuccess: !!loaded.result?.id,
    manualEncodedLoadId: loaded.result?.id,
  }, 'manual-encode')

  return { partId }
}
