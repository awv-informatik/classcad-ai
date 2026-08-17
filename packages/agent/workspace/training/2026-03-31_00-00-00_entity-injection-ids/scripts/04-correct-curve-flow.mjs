// Q: Correct flow — part → EI → shape → curve.line. What IDs come back?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MyShape' })).result
  console.log('[04] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  const r = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[04] curve.line result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('line-in-shape')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'curve-line-correct')

  return { partId, eifId, shapeId }
}
