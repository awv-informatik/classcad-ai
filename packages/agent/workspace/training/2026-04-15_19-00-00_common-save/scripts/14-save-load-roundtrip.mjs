// Save → clear → load roundtrip to verify save content is usable
// (Technically tests load too, but validates save output is correct)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Roundtrip' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[14] original partId:', partId, 'boxId:', boxId)

  await snapshot('before-save')

  // Save with deflate+base64 (practical pipeline)
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[14] save success:', saved.result.success)
  console.log('[14] saved content length:', saved.result.content.length)

  // Verify content is non-empty and starts with expected base64 chars
  const content = saved.result.content
  console.log('[14] content starts with:', content.substring(0, 50))

  // Store the content for reference
  filewrite(content, 'saved-ofb-data')

  // Now clear
  const clearR = await api.v1.common.clear({})
  console.log('[14] clear maxLevel:', clearR.maxLevel)

  // Load back
  const loadR = await api.v1.common.load({ data: content, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[14] load result:', JSON.stringify(loadR.result))
  console.log('[14] load maxLevel:', loadR.maxLevel)
  console.log('[14] load messages:', JSON.stringify(loadR.messages))

  await snapshot('after-roundtrip')

  // Verify structure is intact
  filewrite(loadR.structure, 'loaded-structure')

  return { partId: loadR.result?.id }
}
