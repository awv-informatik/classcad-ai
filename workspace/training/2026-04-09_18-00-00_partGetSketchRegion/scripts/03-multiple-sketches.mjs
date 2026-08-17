// Multiple sketches: region in second sketch, can part.getSketchRegion find it?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // First sketch — no region
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const rect1 = (await api.v1.sketch.rectangle({
    id: sk1, startPos: [0, 0, 0], endPos: [40, 30, 0],
  })).result

  // Second sketch — has a named region
  const sk2 = (await api.v1.sketch.create({ id: partId })).result
  const rect2 = (await api.v1.sketch.rectangle({
    id: sk2, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  const region2Id = (await api.v1.sketch.sketchRegion({
    id: sk2, geomIds: rect2, name: 'SecondSketchRegion',
  })).result

  console.log('[03] region in sketch2:', region2Id)

  // Lookup from part — should find region in second sketch
  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'SecondSketchRegion' })
  console.log('[03] part lookup result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] match:', r.result === region2Id)

  filewrite({
    sk1, sk2,
    region2Id,
    lookupResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    match: r.result === region2Id,
  }, 'multiple-sketches')

  return { partId }
}
