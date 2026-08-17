// Test: part.sketch with planeId param — does it work the same as sketch.create?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Create work plane
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'MyPlane',
    normal: [1, 0, 0],
    position: [50, 0, 0],
  })).result
  console.log('[20] workPlane:', wpId)

  // Create sketch via part.sketch with planeId
  const r = await api.v1.part.sketch({ id: partId, planeId: wpId, name: 'ViaPartOnPlane' })
  console.log('[20] part.sketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[20] messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'part-sketch-with-plane')

  await snapshot('part-sketch-on-plane')

  return { partId }
}
