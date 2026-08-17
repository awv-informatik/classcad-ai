// Empty tools array — should be a no-op like union/subtraction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionEmptyTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  console.log('[07] box:', box)

  const r = await api.v1.solid.intersection({ id: eifId, target: box, tools: [] })
  console.log('[07] empty tools result:', r.result)
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-tools-response')

  return { partId, result: r.result }
}
