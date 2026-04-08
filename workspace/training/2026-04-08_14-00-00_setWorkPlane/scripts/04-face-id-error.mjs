// Test: setWorkPlane with a face ID (should fail — only work plane IDs accepted)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FaceTest' })).result

  // Create a box to get face IDs
  const boxR = await api.v1.part.box({ id: partId, xLen: 100, yLen: 80, zLen: 60 })
  const boxId = boxR.result
  console.log('[04] boxId:', boxId)

  // Get a face ID from graphic
  const meshes = boxR.graphic?.containers?.[0]?.meshes || []
  const faceId = meshes[0]?.id
  console.log('[04] faceId:', faceId)

  // Create a sketch
  const skId = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  console.log('[04] skId:', skId)

  // Try setWorkPlane with face ID
  const r = await api.v1.sketch.setWorkPlane({ id: skId, planeId: faceId })
  console.log('[04] face as plane — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'face-id-error')

  return { partId }
}
