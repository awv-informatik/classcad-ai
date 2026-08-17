// 15 — Does changing chordHeightTol/angleTol affect mesh quality (vertex count)?
// Create a sphere, compare mesh vertex counts at different tolerances.
export default async function (api, { filewrite }) {
  const results = []

  for (const [chord, angle] of [[0.1, 0], [0.5, 0], [1.0, 0], [0.1, 10], [0.1, 30]]) {
    // Reset
    const partId = (await api.v1.part.create({ name: 'MeshQual' })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    await api.v1.common.setDatabaseSettings({ chordHeightTol: chord, angleTol: angle })

    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const g = sphR.graphic

    let totalVerts = 0
    let totalIndices = 0
    if (g?.containers) {
      g.containers.forEach(c => {
        c.meshes?.forEach(m => {
          totalVerts += (m.vertices?.length || 0) / 3  // xyz triplets
          totalIndices += (m.indices?.length || 0)
        })
      })
    }

    const entry = { chordHeightTol: chord, angleTol: angle, vertexCount: totalVerts, indexCount: totalIndices }
    console.log(`[15] chord=${chord} angle=${angle}: ${totalVerts} verts, ${totalIndices} indices`)
    results.push(entry)
  }

  // Restore
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0 })

  filewrite(results, 'mesh-quality')

  return results
}
