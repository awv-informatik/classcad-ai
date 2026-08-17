// Inverse test: valid inputs still work, batch with one bad entry doesn't block valid ones.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpInv' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Valid 2-point line
  const r2 = await api.v1.curve.interpolationCurve({ id: shapeId, points: [[0,0,0],[10,10,0]] })
  console.log('[inv] 2 valid pts:', r2.maxLevel, JSON.stringify(r2.messages))

  // Valid 8-point smooth curve
  const r8 = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [[0,0,0],[10,5,0],[20,12,0],[30,15,0],[40,12,0],[50,5,0],[60,2,0],[70,0,0]],
  })
  console.log('[inv] 8 valid pts:', r8.maxLevel, JSON.stringify(r8.messages))

  // Batch: one valid, one with dup, one valid -- valid ones should still create curves
  const batch = await api.v1.curve.interpolationCurve([
    { id: shapeId, points: [[100,0,0],[100,10,0],[110,10,0]] },
    { id: shapeId, points: [[200,0,0],[200,0,0],[210,10,0]] }, // dup
    { id: shapeId, points: [[300,0,0],[310,5,0],[320,0,0]] },
  ])
  console.log('[inv] batch:', batch.maxLevel, JSON.stringify(batch.messages))

  filewrite({ r2, r8, batch }, 'inverse-results')
  return { r2, r8, batch }
}
