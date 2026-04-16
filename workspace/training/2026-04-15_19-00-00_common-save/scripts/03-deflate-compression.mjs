// Test save with deflate compression — compare size with raw
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save raw OFB
  const raw = await api.v1.common.save({ format: 'OFB' })
  // Save with deflate only
  const deflated = await api.v1.common.save({ format: 'OFB', compression: 'deflate' })

  console.log('[03] raw length:', raw.result.content.length)
  console.log('[03] deflated length:', deflated.result.content.length)
  console.log('[03] deflated success:', deflated.result.success)
  console.log('[03] deflated content type:', typeof deflated.result.content)
  console.log('[03] deflated first 100 chars:', deflated.result.content.substring(0, 100))
  console.log('[03] compression ratio:', (deflated.result.content.length / raw.result.content.length).toFixed(3))
  console.log('[03] maxLevel:', deflated.maxLevel)

  filewrite({ rawLength: raw.result.content.length, deflatedLength: deflated.result.content.length, compressionRatio: deflated.result.content.length / raw.result.content.length, deflatedPreview: deflated.result.content.substring(0, 200) }, 'deflate-comparison')

  return { partId }
}
