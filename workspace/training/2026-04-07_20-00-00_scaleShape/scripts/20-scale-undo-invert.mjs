// Test if scale can be "undone" by scaling by 1/factor
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Undo' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [30, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 10, 0], endPos: [30, 25, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 25, 0], endPos: [10, 25, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 25, 0], endPos: [10, 10, 0] })

  await snapshot('original')

  // Scale up 5x
  await api.v1.curve.scaleShape({ id: shapeId, factor: 5.0 })
  await snapshot('scaled-5x')

  // Scale back down by 1/5 = 0.2
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 0.2 })
  console.log('[20] scale invert result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'inverted-graphic')

  await snapshot('inverted-back')

  // Should match original coordinates

  return { partId }
}
