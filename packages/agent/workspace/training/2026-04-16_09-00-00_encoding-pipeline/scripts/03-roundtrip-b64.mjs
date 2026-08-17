// Test roundtrip with base64-only (no compression)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripB64' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with base64 only
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[03] save: success=', saved.result.success, 'len=', saved.result.content?.length)

  // Clear
  await api.v1.common.clear({})

  // Load with matching base64
  const loaded = await api.v1.common.load({ data: saved.result.content, format: 'OFB', encoding: 'base64' })
  console.log('[03] load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)
  console.log('[03] load messages:', JSON.stringify(loaded.messages))

  // Verify: re-save with same params and compare
  const resaved = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[03] resave: success=', resaved.result.success, 'len=', resaved.result.content?.length)
  console.log('[03] content matches:', saved.result.content === resaved.result.content)

  filewrite({
    originalLen: saved.result.content?.length,
    resavedLen: resaved.result.content?.length,
    contentMatch: saved.result.content === resaved.result.content,
    loadedId: loaded.result?.id,
    originalPartId: partId,
  }, 'roundtrip-b64')

  return { partId }
}
