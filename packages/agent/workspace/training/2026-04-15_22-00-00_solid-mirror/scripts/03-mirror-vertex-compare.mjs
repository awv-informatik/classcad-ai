// Compare vertex positions before and after mirror using graphic data from API responses
// Mirror box across YZ plane: X coords should negate, Y/Z unchanged
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorVtx' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create asymmetric box offset from origin
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })
  const boxId = boxR.result
  console.log('[03] boxId:', boxId)

  // Extract bounding box from graphic vertices before mirror
  function extractBounds(graphic) {
    if (!graphic || !graphic.bodies) return null
    const results = {}
    for (const body of graphic.bodies) {
      const verts = body.vertices
      if (!verts || verts.length === 0) continue
      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity
      let minZ = Infinity, maxZ = -Infinity
      for (let i = 0; i < verts.length; i += 3) {
        minX = Math.min(minX, verts[i])
        maxX = Math.max(maxX, verts[i])
        minY = Math.min(minY, verts[i + 1])
        maxY = Math.max(maxY, verts[i + 1])
        minZ = Math.min(minZ, verts[i + 2])
        maxZ = Math.max(maxZ, verts[i + 2])
      }
      results[body.id || 'unknown'] = {
        bounds: { minX, maxX, minY, maxY, minZ, maxZ },
        vertexCount: verts.length / 3,
      }
    }
    return results
  }

  const boundsBefore = extractBounds(boxR.graphic)
  console.log('[03] bounds before:', JSON.stringify(boundsBefore))

  // Create a fixed reference cylinder (won't be mirrored)
  await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 10 })

  await snapshot('before')

  // Mirror the box across YZ plane (normal=[1,0,0], origin=[0,0,0])
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 0],
  })

  const boundsAfter = extractBounds(mirrorR.graphic)
  console.log('[03] bounds after:', JSON.stringify(boundsAfter))
  console.log('[03] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: boundsBefore, after: boundsAfter }, 'bounds-comparison')

  await snapshot('after')

  return { partId, eifId, boxId }
}
