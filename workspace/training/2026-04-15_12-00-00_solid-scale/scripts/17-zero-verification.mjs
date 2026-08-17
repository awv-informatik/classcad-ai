// Verify factor=0 is a no-op: scale an offset box by 0, check bounding box
// If truly scaled to 0, min/max would collapse. If no-op, stays the same.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroVerifyTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Single offset box — 50x40x30 at [100, 0, 0]
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30, translation: [100, 0, 0] })).result

  // Get baseline graphic
  const baseline = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 1 })
  const bbBase = baseline.graphic?.containers?.[0]?.properties
  console.log('[17] baseline min:', JSON.stringify(bbBase?.min), 'max:', JSON.stringify(bbBase?.max))

  // Scale by 0
  const zero = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 0 })
  const bbZero = zero.graphic?.containers?.[0]?.properties
  console.log('[17] after 0x min:', JSON.stringify(bbZero?.min), 'max:', JSON.stringify(bbZero?.max))

  // Scale by 2 AFTER the factor=0 to check if the body is still alive
  const after2 = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 2 })
  const bb2 = after2.graphic?.containers?.[0]?.properties
  console.log('[17] after 0x then 2x min:', JSON.stringify(bb2?.min), 'max:', JSON.stringify(bb2?.max))

  // Also try very small factor: 0.0001
  const partId2 = (await api.v1.part.create({ name: 'TinyVerify' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2 })).result
  const box2 = (await api.v1.solid.box({ id: eifId2, length: 50, width: 40, height: 30, translation: [100, 0, 0] })).result
  const tiny = await api.v1.solid.scale({ id: eifId2, target: box2, factor: 0.0001 })
  const bbTiny = tiny.graphic?.containers?.[0]?.properties
  console.log('[17] after 0.0001x min:', JSON.stringify(bbTiny?.min), 'max:', JSON.stringify(bbTiny?.max))

  filewrite({
    baseline: { min: bbBase?.min, max: bbBase?.max },
    afterZero: { min: bbZero?.min, max: bbZero?.max },
    afterZeroThen2: { min: bb2?.min, max: bb2?.max },
    afterTiny: { min: bbTiny?.min, max: bbTiny?.max },
  }, 'zero-verify-data')

  return { partId, eifId, boxId }
}
