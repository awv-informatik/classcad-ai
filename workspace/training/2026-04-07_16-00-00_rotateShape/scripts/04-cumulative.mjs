// 04 — Is rotation cumulative? Two 45° rotations should equal one 90° rotation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CumulativeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: two 45° rotations
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'TwoSteps' })).result
  await api.v1.curve.line({ id: s1, startPos: [-30, 0, 0], endPos: [-30, 20, 0] })
  await api.v1.curve.line({ id: s1, startPos: [-30, 20, 0], endPos: [-10, 20, 0] })

  const r1a = await api.v1.curve.rotateShape({ id: s1, rotation: [0, 0, Math.PI / 4] })
  console.log('[04] First 45° rotation:', r1a.result, 'maxLevel:', r1a.maxLevel)

  const r1b = await api.v1.curve.rotateShape({ id: s1, rotation: [0, 0, Math.PI / 4] })
  console.log('[04] Second 45° rotation:', r1b.result, 'maxLevel:', r1b.maxLevel)

  // Shape 2: one 90° rotation for comparison
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'OneStep' })).result
  await api.v1.curve.line({ id: s2, startPos: [10, 0, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: s2, startPos: [10, 20, 0], endPos: [30, 20, 0] })

  const r2 = await api.v1.curve.rotateShape({ id: s2, rotation: [0, 0, Math.PI / 2] })
  console.log('[04] Single 90° rotation:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('cumulative-comparison')

  return { partId }
}
