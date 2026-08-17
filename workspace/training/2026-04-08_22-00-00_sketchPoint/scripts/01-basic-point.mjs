// Basic sketch.point creation — happy path
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PointTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[01] partId:', partId, 'skId:', skId)

  // Create a single point at origin
  const r1 = await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })
  console.log('[01] point at origin — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'point-origin-response')

  // Create a point at (50, 30, 0)
  const r2 = await api.v1.sketch.point({ id: skId, pos: [50, 30, 0] })
  console.log('[01] point at (50,30,0) — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Create a point at negative coords
  const r3 = await api.v1.sketch.point({ id: skId, pos: [-25, -15, 0] })
  console.log('[01] point at (-25,-15,0) — result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Verify positions with getPositions
  const pos1 = await api.v1.sketch.getPositions({ id: r1.result })
  const pos2 = await api.v1.sketch.getPositions({ id: r2.result })
  const pos3 = await api.v1.sketch.getPositions({ id: r3.result })
  console.log('[01] pos1:', JSON.stringify(pos1.result))
  console.log('[01] pos2:', JSON.stringify(pos2.result))
  console.log('[01] pos3:', JSON.stringify(pos3.result))

  filewrite({
    point1: { id: r1.result, pos: pos1.result },
    point2: { id: r2.result, pos: pos2.result },
    point3: { id: r3.result, pos: pos3.result },
  }, 'all-positions')

  await snapshot('three-points')
  return { partId, skId }
}
