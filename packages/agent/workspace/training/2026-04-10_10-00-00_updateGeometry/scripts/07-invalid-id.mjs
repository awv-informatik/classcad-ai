// Test: updateGeometry with an invalid/nonexistent ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point so sketch isn't empty
  const geo = await api.v1.sketch.geometry({
    id: skId,
    points: [{ pos: [10, 10, 0] }],
    genFixation: false,
  })
  console.log('[07] created point:', geo.result.points[0])

  // Try to update a point with a fake ID
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    points: [{ id: 99999, pos: [50, 50, 0] }],
  })
  console.log('[07] fake ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] fake ID messages:', JSON.stringify(r1.messages))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'invalid-id-response')

  return { partId }
}
