// Test updateDimensionPosition with wrong ID types (sketch, part, line, constraint)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Try with sketch ID
  const r1 = await api.v1.sketch.updateDimensionPosition({ id: skId, pos: [10, 10, 0] })
  console.log('[04] sketch ID → result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Try with part ID
  const r2 = await api.v1.sketch.updateDimensionPosition({ id: partId, pos: [10, 10, 0] })
  console.log('[04] part ID → result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Try with line ID
  const r3 = await api.v1.sketch.updateDimensionPosition({ id: rectIds[0], pos: [10, 10, 0] })
  console.log('[04] line ID → result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Try with constraint ID (create one first)
  const cR = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [rectIds[0]] })
  const cId = cR.result
  console.log('[04] constraint ID:', cId)
  const r4 = await api.v1.sketch.updateDimensionPosition({ id: cId, pos: [10, 10, 0] })
  console.log('[04] constraint ID → result:', r4.result, 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  filewrite({
    sketchId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    lineId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    constraintId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'wrong-id-errors')

  return {}
}
