// Test scaleShape with factor = -2.0 (negative scale larger than 1)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegScale2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'L' })).result

  // L-shape for clear visual asymmetry
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  await snapshot('before-neg2-scale')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: -2.0 })
  console.log('[18] scaleShape -2.0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg2-response')

  await snapshot('after-neg2-scale')
  filewrite(r.graphic, 'neg2-graphic')

  return { partId }
}
