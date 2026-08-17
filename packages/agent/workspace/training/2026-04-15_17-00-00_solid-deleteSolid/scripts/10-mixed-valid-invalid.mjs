// Test: ids array with mix of valid and invalid IDs — does it delete the valid ones?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedIds' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  console.log('[10] box1:', box1, 'box2:', box2)

  await snapshot('before')

  // Pass one valid ID (box1) and one invalid ID (99999)
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1, 99999] })
  console.log('[10] mixed — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mixed-response')

  await snapshot('after-mixed')

  return { partId, eifId, box2 }
}
