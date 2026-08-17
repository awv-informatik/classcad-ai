// Test: edge cases — zero rotation, large angles (>2π), negative angles, [0,0,0] translation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Zero rotation vector — should be same as no rotation
  const r1 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    rotation: [0, 0, 0]
  })
  console.log('[07] zero rotation:', r1.result, 'maxLevel:', r1.maxLevel)

  // Zero translation vector — should be same as no translation
  const r2 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    translation: [0, 0, 0]
  })
  console.log('[07] zero translation:', r2.result, 'maxLevel:', r2.maxLevel)

  // Large rotation (> 2π = full circle) — should wrap around
  const r3 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    rotation: [0, 0, Math.PI * 2 + Math.PI / 4],  // 360° + 45° = should look like 45°
    translation: [0, 80, 0]
  })
  console.log('[07] >2π rotation:', r3.result, 'maxLevel:', r3.maxLevel)

  // Reference: exactly 45° for comparison
  const r4 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 80, 60]
  })
  console.log('[07] 45° reference:', r4.result, 'maxLevel:', r4.maxLevel)

  // Negative rotation
  const r5 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    rotation: [0, 0, -Math.PI / 4],
    translation: [80, 0, 0]
  })
  console.log('[07] negative rotation (-45°):', r5.result, 'maxLevel:', r5.maxLevel)

  // Negative translation
  const r6 = await api.v1.solid.box({
    id: eifId, length: 60, width: 30, height: 20,
    translation: [-50, -50, 0]
  })
  console.log('[07] negative translation:', r6.result, 'maxLevel:', r6.maxLevel)

  await snapshot('edge-cases')
  return { partId }
}
