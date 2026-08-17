// 10 — Self-merge: same solid as both target and tool. Does it hang like self-union?
// WARNING: self-union causes infinite loop. Test with caution — use a timeout approach.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SelfMerge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  console.log('[10] box1:', box1)

  // Self-merge — does it hang?
  console.log('[10] Attempting self-merge...')
  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box1] })
  console.log('[10] self-merge result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] msgs:', JSON.stringify(r.messages))

  await snapshot('self-merge')

  return { partId }
}
