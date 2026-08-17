// Test: updateGeometry with points — move existing points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two points
  const geo = await api.v1.sketch.geometry({
    id: skId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [50, 50, 0] },
    ],
    genFixation: false,
  })
  const [pt1, pt2] = geo.result.points
  console.log('[01] created points:', pt1, pt2)

  await snapshot('before')

  // Update both points
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    points: [
      { id: pt1, pos: [10, 20, 0] },
      { id: pt2, pos: [80, 80, 0] },
    ],
  })
  console.log('[01] updateGeometry result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-points-response')

  await snapshot('after')

  return { partId }
}
