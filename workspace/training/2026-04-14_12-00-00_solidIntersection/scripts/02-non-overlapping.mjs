// What happens when boxes don't overlap at all?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionNoOverlap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [200, 0, 0]  // far apart, no overlap
  })).result

  console.log('[02] box1:', box1, 'box2:', box2)

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2] })
  console.log('[02] non-overlapping result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'non-overlapping-response')

  await snapshot('after-no-overlap')

  return { partId, result: r.result }
}
