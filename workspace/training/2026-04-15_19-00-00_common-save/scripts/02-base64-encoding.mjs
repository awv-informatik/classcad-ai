// Test save with base64 encoding — compare size and content with raw OFB
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save raw OFB (no encoding)
  const raw = await api.v1.common.save({ format: 'OFB' })
  // Save with base64 encoding
  const b64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })

  console.log('[02] raw length:', raw.result.content.length)
  console.log('[02] b64 length:', b64.result.content.length)
  console.log('[02] b64 success:', b64.result.success)
  console.log('[02] b64 first 100 chars:', b64.result.content.substring(0, 100))
  console.log('[02] size ratio (b64/raw):', (b64.result.content.length / raw.result.content.length).toFixed(3))
  console.log('[02] maxLevel:', b64.maxLevel)

  filewrite({ rawLength: raw.result.content.length, b64Length: b64.result.content.length, sizeRatio: b64.result.content.length / raw.result.content.length, b64Preview: b64.result.content.substring(0, 200) }, 'encoding-comparison')

  return { partId }
}
