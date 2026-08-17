export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeDefaults' })).result
  const r = await api.v1.part.cone({ id: partId })

  console.log('[01] cone result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cone-defaults-response')

  await snapshot('defaults')
  return { partId, coneId: r.result }
}
