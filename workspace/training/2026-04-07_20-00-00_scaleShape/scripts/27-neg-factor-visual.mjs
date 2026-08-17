// Verify negative factor visually — create L-shape, scale -1, check if mirrored
// NO pre-snapshot
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegVisual' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference shape (unscaled) — stays for comparison
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Reference' })).result
  await api.v1.curve.advancedPolyline({
    id: ref,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // Target shape (same geometry, will be scaled -1)
  const tgt = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  await api.v1.curve.advancedPolyline({
    id: tgt,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // Scale target by -1 (should mirror around origin)
  const r = await api.v1.curve.scaleShape({ id: tgt, factor: -1.0 })
  console.log('[27] scaleShape -1.0 result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('neg-factor-comparison')

  // Dump graphic to verify coordinates
  const rr = await api.v1.common.recalc({})
  filewrite(rr.graphic, 'neg-comparison-graphic')

  return { partId }
}
