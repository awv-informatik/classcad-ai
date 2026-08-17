// 13 - Semicircle: midPos at exact top of semicircle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SemiCircle' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Perfect semicircle: center at (25,0), radius=25
  // start=(0,0), mid=(25,25) [top of circle], end=(50,0)
  const r = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 25, 0],
    endPos: [50, 0, 0],
  })
  console.log('[13] semicircle maxLevel:', r.maxLevel)

  // Also add the chord line for visual comparison
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })

  await snapshot('semicircle')
  return { partId }
}
