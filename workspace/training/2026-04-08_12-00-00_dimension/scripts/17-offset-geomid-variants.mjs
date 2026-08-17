// Test OFFSET with different geomId combinations: line+point, point+line, 2 lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [40, 20, 0] })).result
  console.log('[17] line1:', line1, 'line2:', line2, 'pt1:', pt1)

  // OFFSET between 2 parallel lines
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line1, line2] })
  console.log('[17] OFFSET 2-lines result:', r1.result, 'maxLevel:', r1.maxLevel)

  // OFFSET between line and point
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line1, pt1] })
  console.log('[17] OFFSET line+point result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[17] messages:', JSON.stringify(r2.messages))

  // OFFSET between point and line (reversed order)
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [pt1, line2] })
  console.log('[17] OFFSET point+line result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[17] messages:', JSON.stringify(r3.messages))

  // OFFSET with 3 geomIds (should fail)
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [line1, line2, pt1] })
  console.log('[17] OFFSET 3-geomIds result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[17] messages:', JSON.stringify(r4.messages))

  filewrite({
    offset2Lines: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    offsetLinePoint: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    offsetPointLine: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    offset3GeomIds: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'offset-variant-responses')

  await snapshot('offset-variants')
  return { partId, skId }
}
