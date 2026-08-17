export default async function (api, { snapshot, filewrite }) {
  // Create a source part, save to a temp file
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'FileBox', length: 60, width: 40, height: 25 })

  const saveResult = await api.v1.common.save({ file: '/tmp/cc-test-import.stp', format: 'STP' })
  console.log('[02] save to file success:', saveResult.result.success)

  // Clear and create target
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'FileTarget' })).result

  // Import from local file
  const r = await api.v1.part.importFeature({
    id: tgtPart,
    file: '/tmp/cc-test-import.stp',
    name: 'FileImport',
  })
  console.log('[02] importFeature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'file-import-response')
  await snapshot('file-import')

  return { tgtPart, importId: r.result }
}
