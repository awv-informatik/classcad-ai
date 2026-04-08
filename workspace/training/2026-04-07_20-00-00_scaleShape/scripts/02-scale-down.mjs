// Test scaleShape with factor < 1 (shrink by half)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleDown' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [50, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [50, 10, 0], endPos: [50, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [50, 40, 0], endPos: [10, 40, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 40, 0], endPos: [10, 10, 0] })

  await snapshot('before-scale-down')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 0.5 })
  console.log('[02] scaleShape 0.5 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'scale-down-response')

  await snapshot('after-scale-half')
  filewrite(r.graphic, 'after-scale-down-graphic')

  return { partId }
}
