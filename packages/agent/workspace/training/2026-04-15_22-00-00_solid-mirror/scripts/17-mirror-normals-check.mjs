// Check if face normals are preserved or flipped after mirror
// A proper mirror should flip face normals (determinant of reflection matrix is -1)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NormalsCheck' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })
  const boxId = boxR.result

  // Extract some normals before mirror
  function extractNormals(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    if (!c?.meshes?.[0]?.normals) return null
    const n = c.meshes[0].normals
    // Return first few normal triplets
    const first5 = []
    for (let i = 0; i < Math.min(n.length, 15); i += 3) {
      first5.push([n[i], n[i+1], n[i+2]])
    }
    return first5
  }

  const normalsBefore = extractNormals(boxR.graphic, boxId)
  console.log('[17] normals before (first 5):', JSON.stringify(normalsBefore))

  // Mirror across YZ plane
  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const normalsAfter = extractNormals(mirrorR.graphic, boxId)
  console.log('[17] normals after (first 5):', JSON.stringify(normalsAfter))

  // For YZ plane mirror (X reflection): normals with X component should flip
  // e.g., [0,0,-1] stays [0,0,-1], but [1,0,0] becomes [-1,0,0]
  filewrite({ before: normalsBefore, after: normalsAfter }, 'normals-comparison')

  return { partId, eifId, boxId }
}
