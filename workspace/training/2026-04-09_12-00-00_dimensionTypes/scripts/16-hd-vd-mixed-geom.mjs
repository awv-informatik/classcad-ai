// Test HD/VD with mixed geometry: line+point, line+line (should fail for HD/VD with 2 lines)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 0, 0] })).result
  const pt = (await api.v1.sketch.point({ id: skId, pos: [50, 30, 0] })).result

  // HD line+point
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [line, pt], name: 'hd-line-pt' })
  console.log('[16] HD line+pt:', r1.result, 'maxLevel=', r1.maxLevel)
  if (r1.messages) console.log('[16] HD line+pt msgs:', JSON.stringify(r1.messages))

  // VD line+point
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [line, pt], name: 'vd-line-pt' })
  console.log('[16] VD line+pt:', r2.result, 'maxLevel=', r2.maxLevel)
  if (r2.messages) console.log('[16] VD line+pt msgs:', JSON.stringify(r2.messages))

  // HD point+line (reversed)
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [pt, line], name: 'hd-pt-line' })
  console.log('[16] HD pt+line:', r3.result, 'maxLevel=', r3.maxLevel)
  if (r3.messages) console.log('[16] HD pt+line msgs:', JSON.stringify(r3.messages))

  // OFFSET line+point (for comparison — this should work)
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line, pt], name: 'off-line-pt' })
  console.log('[16] OFFSET line+pt:', r4.result, 'maxLevel=', r4.maxLevel)

  // OFFSET point+line
  const r5 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [pt, line], name: 'off-pt-line' })
  console.log('[16] OFFSET pt+line:', r5.result, 'maxLevel=', r5.maxLevel)

  return { partId }
}
