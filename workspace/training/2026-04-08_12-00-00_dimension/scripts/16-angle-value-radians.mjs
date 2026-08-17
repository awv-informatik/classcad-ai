// Test ANGLE with numeric value (radians, not deg string) — investigate the value-set failure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result

  // Try ANGLE with numeric value (radians) — auto-calc should be ~0.785 rad (45 deg)
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], value: 0.785 })
  console.log('[16] ANGLE numeric rad result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[16] messages:', JSON.stringify(r1.messages))

  // Try ANGLE with string '45deg'
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], value: '45deg' })
  console.log('[16] ANGLE string deg result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[16] messages:', JSON.stringify(r2.messages))

  // Try ANGLE with numeric value that matches the actual angle
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], value: Math.atan2(40, 40) })
  console.log('[16] ANGLE matching rad result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[16] messages:', JSON.stringify(r3.messages))

  // Try creating ANGLE first without value, then update
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2] })
  console.log('[16] ANGLE no-value result:', r4.result, 'maxLevel:', r4.maxLevel)

  const r5 = await api.v1.sketch.updateDimension({ id: r4.result, value: 1.0 })
  console.log('[16] updateDimension ANGLE result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[16] updateDimension messages:', JSON.stringify(r5.messages))

  filewrite({
    angleNumeric: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    angleStringDeg: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    angleMatchingRad: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    angleNoValue: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    updateAngle: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'angle-value-responses')

  await snapshot('angle-values')
  return { partId, skId }
}
