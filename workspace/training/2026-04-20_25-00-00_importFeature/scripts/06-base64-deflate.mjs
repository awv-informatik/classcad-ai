export default async function (api, { snapshot, filewrite }) {
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'Box', length: 50, width: 40, height: 30 })

  // Save with both base64 encoding AND deflate compression
  const saveResult = await api.v1.common.save({ format: 'STP', encoding: 'base64', compression: 'deflate' })
  console.log('[06] save base64+deflate success:', saveResult.result.success, 'data length:', saveResult.result.content?.length)

  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    encoding: 'base64',
    compression: 'deflate',
    name: 'DoubleEncodedImport',
  })
  console.log('[06] importFeature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'base64-deflate-response')
  await snapshot('base64-deflate-import')

  return { importId: r.result }
}
