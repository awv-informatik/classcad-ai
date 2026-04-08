// Test combining scaleShape with translateShape — verify order matters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleTrans' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape A: scale then translate
  const sA = (await api.v1.curve.shape({ id: eifId, name: 'ScaleThenTrans' })).result
  await api.v1.curve.line({ id: sA, startPos: [10, 10, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: sA, startPos: [20, 10, 0], endPos: [20, 20, 0] })
  await api.v1.curve.line({ id: sA, startPos: [20, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: sA, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  await api.v1.curve.scaleShape({ id: sA, factor: 2.0 })
  await api.v1.curve.translateShape({ id: sA, translation: [100, 0, 0] })

  // Shape B: translate then scale (different result if origin-based scaling)
  const sB = (await api.v1.curve.shape({ id: eifId, name: 'TransThenScale' })).result
  await api.v1.curve.line({ id: sB, startPos: [10, 10, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: sB, startPos: [20, 10, 0], endPos: [20, 20, 0] })
  await api.v1.curve.line({ id: sB, startPos: [20, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: sB, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  await api.v1.curve.translateShape({ id: sB, translation: [100, 0, 0] })
  await api.v1.curve.scaleShape({ id: sB, factor: 2.0 })

  await snapshot('scale-translate-comparison')

  // If origin-centered:
  //  A: scale first → (20,20)-(40,40), then +100 → (120,20)-(140,40)
  //  B: translate first → (110,10)-(120,20), then scale → (220,20)-(240,40)
  // The two shapes should be at different positions

  return { partId }
}
