// Test: translate a shape with multiple curves (line + circle + arc)
// Verify all curves move together
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCurve' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference shape at origin (not translated)
  const sRef = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: sRef, startPos: [0, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.circle({ id: sRef, centerPos: [15, 15, 0], radius: 10 })

  // Shape to translate with multiple curves
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Multi' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.circle({ id: s1, centerPos: [15, 15, 0], radius: 10 })

  // Translate the multi-curve shape
  const r = await api.v1.curve.translateShape({ id: s1, translation: [60, 40, 0] })
  console.log('[12] translate multi-curve:', r.maxLevel, JSON.stringify(r.messages))

  await snapshot('multi-curve-translated')

  return { partId }
}
