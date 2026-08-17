export default async function (api, { snapshot, filewrite }) {
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'Box', length: 50, width: 40, height: 30 })

  // Save with deflate compression
  const saveResult = await api.v1.common.save({ format: 'STP', compression: 'deflate' })
  console.log('[05] save deflate success:', saveResult.result.success, 'data length:', saveResult.result.content?.length)

  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    compression: 'deflate',
    name: 'DeflateImport',
  })
  console.log('[05] importFeature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'deflate-response')
  await snapshot('deflate-import')

  return { importId: r.result }
}
