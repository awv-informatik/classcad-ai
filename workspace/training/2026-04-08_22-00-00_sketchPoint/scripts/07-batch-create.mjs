// Test batch creation — passing an Array<object> to sketch.point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Batch create 4 points
  const r = await api.v1.sketch.point([
    { id: skId, pos: [0, 0, 0] },
    { id: skId, pos: [50, 0, 0] },
    { id: skId, pos: [50, 50, 0] },
    { id: skId, pos: [0, 50, 0] },
  ])
  console.log('[07] batch result:', JSON.stringify(r.result))
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  // Verify each point position
  if (Array.isArray(r.result)) {
    for (let i = 0; i < r.result.length; i++) {
      const pos = await api.v1.sketch.getPositions({ id: r.result[i] })
      console.log('[07] point', i, 'id:', r.result[i], 'pos:', JSON.stringify(pos.result))
    }
  }

  await snapshot('batch-points')
  return { partId, skId }
}
