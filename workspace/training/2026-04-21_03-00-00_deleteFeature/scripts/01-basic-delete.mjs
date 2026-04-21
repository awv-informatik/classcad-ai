export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  const r = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[01] deleteFeature result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-response')

  await snapshot('after')

  // Verify the feature is gone — try getFeature
  const lookup = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[01] getFeature after delete — result:', lookup.result, 'maxLevel:', lookup.maxLevel)
  console.log('[01] getFeature messages:', JSON.stringify(lookup.messages))

  return { partId }
}
