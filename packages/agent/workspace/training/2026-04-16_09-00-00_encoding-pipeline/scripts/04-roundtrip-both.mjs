// Test roundtrip with deflate+base64 (the recommended pipeline)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripBoth' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with deflate+base64
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[04] save: success=', saved.result.success, 'len=', saved.result.content?.length)

  // Clear
  await api.v1.common.clear({})

  // Load with matching deflate+base64
  const loaded = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[04] load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)
  console.log('[04] load messages:', JSON.stringify(loaded.messages))

  // Verify: re-save and compare
  const resaved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[04] resave: success=', resaved.result.success, 'len=', resaved.result.content?.length)
  console.log('[04] content matches:', saved.result.content === resaved.result.content)

  // Also save raw to verify fidelity
  const rawResave = await api.v1.common.save({ format: 'OFB' })
  console.log('[04] raw resave len:', rawResave.result.content?.length)

  filewrite({
    compressedLen: saved.result.content?.length,
    resavedLen: resaved.result.content?.length,
    rawResavedLen: rawResave.result.content?.length,
    contentMatch: saved.result.content === resaved.result.content,
    loadedId: loaded.result?.id,
    originalPartId: partId,
  }, 'roundtrip-both')

  return { partId }
}
