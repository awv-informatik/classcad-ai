// Test ANGLE dimension type between two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two non-parallel lines that form an angle
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result
  console.log('[04] line1:', line1, 'line2:', line2)

  // ANGLE between two lines — auto-calculated value
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2] })
  console.log('[04] ANGLE auto result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))

  // ANGLE with dimPos to select sector
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], dimPos: [30, -20, 0] })
  console.log('[04] ANGLE dimPos result:', r2.result, 'maxLevel:', r2.maxLevel)

  // ANGLE with explicit value
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], value: '60deg' })
  console.log('[04] ANGLE explicit value result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    angleAuto: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    angleDimPos: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    angleExplicit: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'angle-responses')

  await snapshot('angle-dims')
  return { partId, skId }
}
