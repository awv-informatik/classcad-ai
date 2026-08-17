// Full normals check — compare ALL unique face normals before and after mirror
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FullNormals' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })
  const boxId = boxR.result

  function getUniqueNormals(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    if (!c?.meshes) return null
    const unique = new Set()
    for (const mesh of c.meshes) {
      const n = mesh.normals
      if (!n) continue
      for (let i = 0; i < n.length; i += 3) {
        unique.add(`${n[i]},${n[i+1]},${n[i+2]}`)
      }
    }
    return [...unique].map(s => s.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
  }

  const normalsBefore = getUniqueNormals(boxR.graphic, boxId)
  console.log('[21] unique normals before:', JSON.stringify(normalsBefore))
  // Expect: [-1,0,0], [0,-1,0], [0,0,-1], [0,0,1], [0,1,0], [1,0,0] — 6 face normals

  // Mirror across YZ plane (X reflection)
  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const normalsAfter = getUniqueNormals(mirrorR.graphic, boxId)
  console.log('[21] unique normals after:', JSON.stringify(normalsAfter))
  // If normals are properly reflected: X component should negate
  // [-1,0,0] → [1,0,0], [1,0,0] → [-1,0,0], Y/Z unchanged
  // Net effect: same set of 6 normals (since both +X and -X exist)

  // For a proper mirror, the set of unique normals should be the same
  // but the association with faces changes
  const sameSet = JSON.stringify(normalsBefore) === JSON.stringify(normalsAfter)
  console.log('[21] same unique normal set:', sameSet)

  filewrite({ before: normalsBefore, after: normalsAfter, sameSet }, 'normals-full')

  return { partId, eifId, boxId }
}
