// Test doClear parameter — auto-clear before loading
export default async function (api, { snapshot, filewrite }) {
  // Create geometry and save
  const partId = (await api.v1.part.create({ name: 'DoClearTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  // Don't manually clear — use doClear: true
  console.log('[03] Loading with doClear: true...')
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
    doClear: 1, // TRUE
  })
  console.log('[03] Load result:', JSON.stringify(loadR.result))
  console.log('[03] Load maxLevel:', loadR.maxLevel)
  console.log('[03] Load messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'doclear-response')

  await snapshot('after-doclear-load')

  return { loadedId: loadR.result?.id }
}
