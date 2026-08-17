export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxTest' })).result

  const r = await api.v1.part.box({ id: partId })
  console.log('[01] box result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'box-defaults-response')

  await snapshot('defaults')
  return { partId, boxId: r.result }
}
