export default async function (api, { snapshot, filewrite }) {
  // Create a source part with a box, save as STP data string
  const srcPart = (await api.v1.part.create({ name: 'Source' })).result
  await api.v1.part.box({ id: srcPart, name: 'SourceBox', length: 50, width: 40, height: 30 })

  const saveResult = await api.v1.common.save({ format: 'STP' })
  console.log('[01] save success:', saveResult.result.success, 'data length:', saveResult.result.content?.length)

  // Clear and create a new target part
  await api.v1.common.clear({})
  const tgtPart = (await api.v1.part.create({ name: 'Target' })).result

  // Import the STP data into the target part
  const r = await api.v1.part.importFeature({
    id: tgtPart,
    data: saveResult.result.content,
    format: 'STP',
    name: 'ImportedBox',
  })
  console.log('[01] importFeature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'import-response')
  await snapshot('after-import')

  return { tgtPart, importId: r.result }
}
