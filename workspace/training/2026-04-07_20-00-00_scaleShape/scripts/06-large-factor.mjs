// Test scaleShape with large factor (1000x)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeFactor' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [1, 1, 0], endPos: [2, 1, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [2, 1, 0], endPos: [2, 2, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [2, 2, 0], endPos: [1, 2, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [1, 2, 0], endPos: [1, 1, 0] })

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 1000 })
  console.log('[06] scaleShape 1000 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'large-factor-response')

  await snapshot('after-scale-1000x')

  return { partId }
}
