// Basic OFB roundtrip: create → save → clear → load → verify
export default async function (api, { snapshot, filewrite }) {
  // Create geometry
  const partId = (await api.v1.part.create({ name: 'LoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[01] Created part:', partId, 'eif:', eifId, 'box:', boxId)

  await snapshot('before-save')

  // Save with practical pipeline
  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[01] Save success:', saved.result.success, 'content length:', saved.result.content?.length)

  // Clear
  const clearR = await api.v1.common.clear({})
  console.log('[01] Clear result:', clearR.result, 'maxLevel:', clearR.maxLevel)

  await snapshot('after-clear')

  // Load
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[01] Load result:', JSON.stringify(loadR.result))
  console.log('[01] Load maxLevel:', loadR.maxLevel)
  console.log('[01] Load messages:', JSON.stringify(loadR.messages))

  filewrite({ loadResult: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'load-response')

  await snapshot('after-load')

  // Verify: is the loaded part ID the same as the original?
  console.log('[01] Original partId:', partId, 'Loaded id:', loadR.result?.id)
  console.log('[01] IDs match:', partId === loadR.result?.id)

  return { partId, loadedId: loadR.result?.id }
}
