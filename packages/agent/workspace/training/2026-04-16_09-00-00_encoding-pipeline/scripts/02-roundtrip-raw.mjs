// Test roundtrip with raw OFB (no encoding, no compression)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripRaw' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save raw
  const saved = await api.v1.common.save({ format: 'OFB' })
  console.log('[02] save: success=', saved.result.success, 'len=', saved.result.content?.length)

  // Clear
  await api.v1.common.clear({})

  // Load raw (no encoding/compression params)
  const loaded = await api.v1.common.load({ data: saved.result.content, format: 'OFB' })
  console.log('[02] load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)
  console.log('[02] load messages:', JSON.stringify(loaded.messages))

  // Verify: re-save and compare size
  const resaved = await api.v1.common.save({ format: 'OFB' })
  console.log('[02] resave: success=', resaved.result.success, 'len=', resaved.result.content?.length)
  console.log('[02] content matches:', saved.result.content === resaved.result.content)

  filewrite({
    originalLen: saved.result.content?.length,
    resavedLen: resaved.result.content?.length,
    contentMatch: saved.result.content === resaved.result.content,
    loadedId: loaded.result?.id,
    originalPartId: partId,
  }, 'roundtrip-raw')

  return { partId }
}
