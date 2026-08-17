// Test sketch.geometry — empty arrays and missing fields
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Test 1: All empty arrays
  const r1 = await api.v1.sketch.geometry({
    id: skId,
    points: [],
    lines: [],
    circles: [],
  })
  console.log('[07a] all empty - result:', JSON.stringify(r1.result))
  console.log('[07a] maxLevel:', r1.maxLevel)

  // Test 2: No geometry arrays at all (just id)
  const r2 = await api.v1.sketch.geometry({ id: skId })
  console.log('[07b] no arrays - result:', JSON.stringify(r2.result))
  console.log('[07b] maxLevel:', r2.maxLevel)

  // Test 3: Mix of empty and populated
  const r3 = await api.v1.sketch.geometry({
    id: skId,
    points: [],
    lines: [{ startPos: [0, 0, 0], endPos: [10, 10, 0] }],
    circles: [],
  })
  console.log('[07c] mixed empty/populated - result:', JSON.stringify(r3.result))
  console.log('[07c] maxLevel:', r3.maxLevel)

  filewrite({ r1: { result: r1.result, maxLevel: r1.maxLevel }, r2: { result: r2.result, maxLevel: r2.maxLevel }, r3: { result: r3.result, maxLevel: r3.maxLevel } }, 'empty-arrays')

  return { partId }
}
