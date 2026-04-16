// IWP format roundtrip
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IwpLoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save as IWP
  const saved = await api.v1.common.save({ format: 'IWP', encoding: 'base64' })
  console.log('[12] IWP save success:', saved.result.success, 'content length:', saved.result.content?.length)

  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'IWP',
    encoding: 'base64',
  })
  console.log('[12] IWP load result:', JSON.stringify(loadR.result))
  console.log('[12] IWP load maxLevel:', loadR.maxLevel)
  console.log('[12] IWP load messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'iwp-load-response')

  await snapshot('after-iwp-load')

  return { loadedId: loadR.result?.id }
}
