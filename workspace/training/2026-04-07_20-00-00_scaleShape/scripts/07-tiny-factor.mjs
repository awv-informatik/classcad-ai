// Test scaleShape with very small factor (0.001)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TinyFactor' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [50, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [50, 10, 0], endPos: [50, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [50, 40, 0], endPos: [10, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 40, 0], endPos: [10, 10, 0] })

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 0.001 })
  console.log('[07] scaleShape 0.001 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'tiny-factor-response')

  await snapshot('after-scale-tiny')

  return { partId }
}
