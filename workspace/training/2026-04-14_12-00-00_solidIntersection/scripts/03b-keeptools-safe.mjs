// keepTools: true — just the intersection, no follow-up operations
// Isolating whether keepTools itself causes the hang
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionKeepToolsSafe' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[03b] box1:', box1, 'box2:', box2)
  console.log('[03b] about to call intersection with keepTools:true...')

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[03b] keepTools result:', r.result)
  console.log('[03b] maxLevel:', r.maxLevel)
  console.log('[03b] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'keeptools-safe-response')

  await snapshot('after-keeptools')

  return { partId, result: r.result }
}
