// Verify scale coordinates by NOT calling snapshot before scale
// Use structure data from recalc to verify final coordinates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyCoords' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Rectangle from (10,10) to (30,20)
  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [30, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 10, 0], endPos: [30, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  // Scale 2x — NO snapshot before this!
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[21] scaleShape 2x result:', r.result, 'maxLevel:', r.maxLevel)

  // Now snapshot (triggers recalc) — this is fine because we're done scaling
  await snapshot('after-scale-2x')

  // Dump the structure to see final coordinates
  const recalcR = await api.v1.common.recalc({})
  filewrite(recalcR.graphic, 'after-scale-full-graphic')

  return { partId }
}
