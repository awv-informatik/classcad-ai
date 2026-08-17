// Test loading without specifying format (docs say format is optional for file loads)
// For data loads, test if format can be auto-detected
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoFormatTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  await api.v1.common.clear({})

  // Try loading without format
  console.log('[15] Loading without specifying format...')
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[15] No format result:', JSON.stringify(loadR.result))
  console.log('[15] No format maxLevel:', loadR.maxLevel)
  console.log('[15] No format messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'no-format-response')

  return {}
}
