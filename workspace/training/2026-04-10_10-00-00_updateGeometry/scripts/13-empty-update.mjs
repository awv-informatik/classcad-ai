// Test: What happens with empty arrays or no geometry arrays?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create some geometry first
  await api.v1.sketch.geometry({
    id: skId,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
    genFixation: false,
  })

  // Call updateGeometry with empty points array
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    points: [],
  })
  console.log('[13] empty points[] result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Call with no geometry arrays at all (just sketch ID)
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
  })
  console.log('[13] no arrays result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Call with empty lines, circles, arcs
  const r3 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [],
    circles: [],
    arcsBy3Points: [],
    arcsByCenter: [],
  })
  console.log('[13] all-empty result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    emptyPoints: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noArrays: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    allEmpty: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'empty-update')

  return { partId }
}
