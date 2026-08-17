// Test scaleShape on geometry centered at origin vs offset — verify scale center
// Use filewrite to dump graphic edge data for coordinate verification
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AtOrigin' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Centered' })).result

  // Rectangle centered at origin: (-10,-10) to (10,10)
  await api.v1.curve.line({ id: shapeId, startPos: [-10, -10, 0], endPos: [10, -10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, -10, 0], endPos: [10, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [-10, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [-10, 10, 0], endPos: [-10, -10, 0] })

  await snapshot('before-centered-scale')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[17] centered scale result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'centered-scale-graphic')

  await snapshot('after-centered-scale')

  // If origin-centered: new coords should be (-20,-20) to (20,20)
  // If shape-centered: same result since shape IS centered at origin

  return { partId }
}
