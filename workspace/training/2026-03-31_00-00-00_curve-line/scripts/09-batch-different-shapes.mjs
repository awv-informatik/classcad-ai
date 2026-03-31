export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchShapes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result

  // Batch with different shape IDs — can we mix shapes in one batch call?
  const r = await api.v1.curve.line([
    { id: s1, startPos: [0, 0, 0], endPos: [30, 0, 0] },
    { id: s2, startPos: [0, 10, 0], endPos: [30, 10, 0] },
    { id: s1, startPos: [0, 20, 0], endPos: [30, 20, 0] },
  ])
  console.log('[09] mixed shapes batch result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-batch')

  await snapshot('mixed-shapes')
  return { partId }
}
