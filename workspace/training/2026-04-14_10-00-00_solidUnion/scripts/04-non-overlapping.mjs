// 04 — Union of non-overlapping bodies
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionNonOverlap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box 1 at origin
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 40
  })).result

  // Box 2 far away — no overlap
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 40, height: 40,
    translation: [200, 200, 0]
  })).result

  console.log('[04] box1:', box1, 'box2:', box2)

  await snapshot('before-non-overlap-union')

  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
  console.log('[04] union result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'non-overlap-response')

  await snapshot('after-non-overlap-union')

  return { partId, eifId }
}
