// Test subtraction with non-overlapping tool (no intersection)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubNoOverlap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 30
  })).result

  // Tool far away — no overlap
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 30, width: 20, height: 20,
    translation: [200, 200, 200]
  })).result

  console.log('[04] target:', box1, 'tool:', box2)

  const r = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [box2] })
  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-overlap-result')

  await snapshot('result')

  return { partId }
}
