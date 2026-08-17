// Test: sketch.create on a face (from a box solid)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Create a box to get face IDs
  const boxR = await api.v1.part.box({
    id: partId,
    name: 'RefBox',
    xLen: 100,
    yLen: 80,
    zLen: 60,
  })
  console.log('[12] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Get face IDs from graphic data
  const faceIds = boxR.graphic.containers[0].meshes.map(m => m.id)
  console.log('[12] face IDs:', faceIds)

  // Create a sketch on the first face (top face)
  const topFaceId = faceIds[0]
  console.log('[12] placing sketch on face:', topFaceId)

  const r = await api.v1.sketch.create({ id: partId, planeId: topFaceId, name: 'SketchOnFace' })
  console.log('[12] sketch.create on face result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite({
    faceIds,
    usedFaceId: topFaceId,
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'on-face-response')

  await snapshot('sketch-on-face')

  return { partId, sketchId: r.result }
}
