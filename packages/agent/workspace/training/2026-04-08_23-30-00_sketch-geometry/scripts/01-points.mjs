// Test sketch.geometry — creating points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [10, 10, 0] },
      { pos: [20, 0, 0] },
    ],
  })

  console.log('[01] result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'points-response')

  await snapshot('points')
  return { partId }
}
