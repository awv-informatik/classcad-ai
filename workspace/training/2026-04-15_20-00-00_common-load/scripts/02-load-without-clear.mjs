// What happens when you load into a non-cleared drawing?
export default async function (api, { snapshot, filewrite }) {
  // Create geometry and save
  const partId = (await api.v1.part.create({ name: 'ExistingPart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  // DO NOT clear — try loading directly
  console.log('[02] Attempting load without clearing first...')
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[02] Load result:', JSON.stringify(loadR.result))
  console.log('[02] Load maxLevel:', loadR.maxLevel)
  console.log('[02] Load messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'load-no-clear')

  await snapshot('after-load-no-clear')

  return { loadResult: loadR.result }
}
