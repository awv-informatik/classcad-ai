export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegCoords' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Neg' })).result

  // Negative coordinates
  const r1 = await api.v1.curve.line({ id: shapeId, startPos: [-50, -30, 0], endPos: [50, 30, 0] })
  console.log('[08] negative coords:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very large coordinates
  const r2 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [100000, 0, 0] })
  console.log('[08] large coords:', r2.result, 'maxLevel:', r2.maxLevel)

  // Very small (near-zero but not degenerate)
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0.0001, 0.0001, 0] })
  console.log('[08] tiny coords:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    negativeCoords: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    largeCoords: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    tinyCoords: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'coord-tests')

  await snapshot('varied-coords')
  return { partId, shapeId }
}
