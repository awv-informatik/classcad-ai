// SCG format roundtrip
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScgLoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save as SCG
  const saved = await api.v1.common.save({ format: 'SCG', encoding: 'base64' })
  console.log('[17] SCG save success:', saved.result.success, 'content length:', saved.result.content?.length)

  await api.v1.common.clear({})

  // Load SCG — Note: docs say load supports OFB, STP, IWP but not SCG explicitly
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'SCG',
    encoding: 'base64',
  })
  console.log('[17] SCG load result:', JSON.stringify(loadR.result))
  console.log('[17] SCG load maxLevel:', loadR.maxLevel)
  console.log('[17] SCG load messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'scg-load-response')

  await snapshot('after-scg-load')

  return { loadedId: loadR.result?.id }
}
