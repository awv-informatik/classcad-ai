// 08 — part.sketch on a solid face (planeId = face ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box to get faces
  const boxR = await api.v1.part.box({ id: partId, length: 100, width: 80, height: 60 })
  console.log('[08] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Get face IDs from graphic data
  const meshes = boxR.graphic?.containers?.[0]?.meshes || []
  console.log('[08] mesh count:', meshes.length)
  const faceIds = meshes.map(m => m.id)
  console.log('[08] face IDs:', faceIds)

  if (faceIds.length > 0) {
    // Place sketch on first face
    const r = await api.v1.part.sketch({ id: partId, planeId: faceIds[0], name: 'OnFace' })
    console.log('[08] sketch on face — result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[08] messages:', JSON.stringify(r.messages))

    filewrite(r.structure, 'structure-on-face')
    await snapshot('sketch-on-face')
    return { partId, faceId: faceIds[0], sketchId: r.result }
  }

  console.log('[08] no faces found — cannot test')
  return { partId, error: 'no faces' }
}
