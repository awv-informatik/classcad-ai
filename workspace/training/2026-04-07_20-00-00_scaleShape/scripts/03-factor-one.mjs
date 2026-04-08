// Test scaleShape with factor = 1.0 (identity / noop)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FactorOne' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [30, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 10, 0], endPos: [30, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  await snapshot('before-factor-one')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 1.0 })
  console.log('[03] scaleShape 1.0 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'factor-one-response')

  await snapshot('after-factor-one')
  filewrite(r.graphic, 'factor-one-graphic')

  return { partId }
}
