export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylTest' })).result

  // Create cylinder with all defaults
  const r = await api.v1.part.cylinder({ id: partId })
  console.log('[01] cylinder result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'defaults-response')

  await snapshot('defaults')
  return { partId, cylId: r.result }
}
