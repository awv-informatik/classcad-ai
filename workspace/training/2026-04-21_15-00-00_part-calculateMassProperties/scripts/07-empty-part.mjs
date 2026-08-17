export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result
  console.log('[07] partId:', partId)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[07] result:', JSON.stringify(r.result))
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-part')

  return { partId }
}
