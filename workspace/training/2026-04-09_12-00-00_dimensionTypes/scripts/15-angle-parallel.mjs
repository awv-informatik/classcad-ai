// Test ANGLE between parallel lines (degenerate case)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two parallel horizontal lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [100, 30, 0] })).result

  // ANGLE between parallel lines
  const a1 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line2], name: 'parallel' })
  console.log('[15] ANGLE parallel:', a1.result, 'maxLevel=', a1.maxLevel)
  if (a1.messages) console.log('[15] messages:', JSON.stringify(a1.messages))

  // Two nearly-parallel lines (1° apart)
  const line3 = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [100, 51.75, 0] })).result
  const line4 = (await api.v1.sketch.line({ id: skId, startPos: [0, 70, 0], endPos: [100, 70, 0] })).result
  const a2 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line3, line4], name: 'near-parallel' })
  console.log('[15] ANGLE near-parallel:', a2.result, 'maxLevel=', a2.maxLevel)

  // Two perpendicular lines (90°)
  const line5 = (await api.v1.sketch.line({ id: skId, startPos: [0, 90, 0], endPos: [50, 90, 0] })).result
  const line6 = (await api.v1.sketch.line({ id: skId, startPos: [0, 90, 0], endPos: [0, 140, 0] })).result
  const a3 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line5, line6], name: 'perpendicular' })
  console.log('[15] ANGLE perpendicular:', a3.result, 'maxLevel=', a3.maxLevel)

  // ANGLE between same line (1 geomId twice)
  const a4 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1, line1], name: 'same-line' })
  console.log('[15] ANGLE same line:', a4.result, 'maxLevel=', a4.maxLevel)
  if (a4.messages) console.log('[15] same-line messages:', JSON.stringify(a4.messages))

  // ANGLE with 1 geomId only
  const a5 = await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [line1], name: 'single-geomid' })
  console.log('[15] ANGLE 1 geomId:', a5.result, 'maxLevel=', a5.maxLevel)
  if (a5.messages) console.log('[15] single messages:', JSON.stringify(a5.messages))

  await snapshot('angle-edge')
  return { partId }
}
