// Test encoding/compression pipeline with STP format
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STPPipeline' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // STP: raw, base64, deflate+base64
  const raw = await api.v1.common.save({ format: 'STP' })
  const b64 = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  const both = await api.v1.common.save({ format: 'STP', encoding: 'base64', compression: 'deflate' })

  console.log('[10] STP raw: len=', raw.result.content?.length, 'first 80:', raw.result.content?.substring(0, 80))
  console.log('[10] STP b64: len=', b64.result.content?.length)
  console.log('[10] STP both: len=', both.result.content?.length)

  // Verify: raw STP is text (ISO-10303-21 format)
  const rawContent = raw.result.content
  let nonPrintable = 0
  for (let i = 0; i < Math.min(rawContent.length, 1000); i++) {
    const code = rawContent.charCodeAt(i)
    if (code < 32 && code !== 10 && code !== 13 && code !== 9) nonPrintable++
    if (code > 126) nonPrintable++
  }
  console.log('[10] STP raw non-printable in first 1000:', nonPrintable)

  // Roundtrip with deflate+base64
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({
    data: both.result.content,
    format: 'STP',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[10] STP roundtrip: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)

  // Verify with raw inflate
  const { inflateRawSync } = await import('node:zlib')
  const compressedBuf = Buffer.from(both.result.content, 'base64')
  try {
    const inflated = inflateRawSync(compressedBuf)
    console.log('[10] raw inflate of STP: length=', inflated.length, '(raw was', rawContent.length, ')')
    console.log('[10] STP inflated first 80:', inflated.toString('utf-8').substring(0, 80))
  } catch (e) {
    console.log('[10] STP inflate error:', e.message)
  }

  filewrite({
    rawLen: raw.result.content?.length,
    b64Len: b64.result.content?.length,
    bothLen: both.result.content?.length,
    compressedBufLen: compressedBuf.length,
    b64Overhead: (b64.result.content.length / raw.result.content.length).toFixed(3),
    compressionRatio: (both.result.content.length / raw.result.content.length).toFixed(3),
    rawNonPrintable: nonPrintable,
    roundtripSuccess: !!loaded.result?.id,
  }, 'stp-pipeline')

  return { partId }
}
