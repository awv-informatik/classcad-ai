export default async function (api, { snapshot, filewrite }) {
  // Create source geometry
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'Box', length: 50, width: 40, height: 30 })

  // Save as STP with base64 encoding
  const saveResult = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  console.log('[04] save base64 success:', saveResult.result.success, 'data length:', saveResult.result.content?.length)

  // Clear and create target
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  // Import with encoding param
  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    encoding: 'base64',
    name: 'Base64Import',
  })
  console.log('[04] importFeature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'base64-response')
  await snapshot('base64-import')

  return { importId: r.result }
}
