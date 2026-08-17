// Test angleTol effect on mesh density — compare with chordHeightTol fixed
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  const angles = [0, 5, 15, 30, 45, 90]
  const results = []

  for (const ang of angles) {
    await api.v1.common.clear({})
    const pId = (await api.v1.part.create({ name: 'AngleTest' })).result
    const eid = (await api.v1.part.entityInjection({ id: pId, name: 'EIF' })).result

    await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: 0.1, angleTol: ang })
    const verify = (await api.v1.common.getDatabaseSettings()).result

    const sphereR = await api.v1.solid.sphere({ id: eid, radius: 20 })
    const hasGraphic = sphereR.graphic && sphereR.graphic.containers && sphereR.graphic.containers.length > 0
    let vertexCount = 0
    if (hasGraphic && sphereR.graphic.containers[0].meshes && sphereR.graphic.containers[0].meshes.length > 0) {
      const mesh = sphereR.graphic.containers[0].meshes[0]
      vertexCount = mesh.vertices ? mesh.vertices.length / 3 : 0
    }
    console.log(`[05] angleTol=${ang}: vertices=${vertexCount}, verify.angleTol=${verify.angleTol}`)
    results.push({ angleTol: ang, vertexCount, verifiedAngle: verify.angleTol })
  }

  filewrite(results, 'angle-density')
  return { results }
}
