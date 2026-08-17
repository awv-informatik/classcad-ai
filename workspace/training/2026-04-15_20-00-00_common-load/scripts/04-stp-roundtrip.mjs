// STP format roundtrip — test ID changes and format handling
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StpLoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[04] Original IDs — part:', partId, 'eif:', eifId, 'box:', boxId)

  await snapshot('before-stp-save')

  // Save as STP
  const saved = await api.v1.common.save({
    format: 'STP',
    encoding: 'base64',
  })
  console.log('[04] STP save success:', saved.result.success, 'content length:', saved.result.content?.length)

  // Clear and load
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'STP',
    encoding: 'base64',
  })
  console.log('[04] STP load result:', JSON.stringify(loadR.result))
  console.log('[04] STP load maxLevel:', loadR.maxLevel)
  console.log('[04] Original partId:', partId, 'Loaded id:', loadR.result?.id)
  console.log('[04] IDs match:', partId === loadR.result?.id)

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages, originalPartId: partId }, 'stp-load-response')

  await snapshot('after-stp-load')

  return { originalPartId: partId, loadedId: loadR.result?.id }
}
