// 04 — Deep comparison of merge vs union graphic/structure data.
// Same geometry, different operations. Focus on vertex counts, face structure, edges.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeepCompare' })).result

  // --- MERGE ---
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const mB1 = (await api.v1.solid.box({ id: eif1, length: 100, width: 60, height: 40 })).result
  const mB2 = (await api.v1.solid.box({
    id: eif1, length: 60, width: 40, height: 80, translation: [60, 30, 0]
  })).result
  const mergeR = await api.v1.solid.merge({ id: eif1, target: mB1, tools: [mB2] })

  // --- UNION ---
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const uB1 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40, translation: [0, 0, 120] })).result
  const uB2 = (await api.v1.solid.box({
    id: eif2, length: 60, width: 40, height: 80, translation: [60, 30, 120]
  })).result
  const unionR = await api.v1.solid.union({ id: eif2, target: uB1, tools: [uB2] })

  // Analyze graphic
  const analyzeGraphic = (g, label) => {
    if (!g) { console.log(`[04] ${label}: no graphic`); return }
    console.log(`[04] ${label} graphic keys:`, Object.keys(g))
    if (g.solids) {
      console.log(`[04] ${label} solids count:`, g.solids.length)
      for (const s of g.solids) {
        console.log(`[04]   solid ${s.id}: keys=[${Object.keys(s)}]`)
        if (s.vertices) console.log(`[04]   solid ${s.id}: ${s.vertices.length / 3} verts`)
        if (s.indices) console.log(`[04]   solid ${s.id}: ${s.indices.length / 3} triangles`)
        if (s.normals) console.log(`[04]   solid ${s.id}: ${s.normals.length / 3} normals`)
        if (s.edges) console.log(`[04]   solid ${s.id}: ${s.edges.length} edge groups`)
      }
    }
  }

  analyzeGraphic(mergeR.graphic, 'merge')
  analyzeGraphic(unionR.graphic, 'union')

  // Also dump the structure trees to compare feature tree shape
  filewrite(mergeR.structure, 'merge-structure')
  filewrite(unionR.structure, 'union-structure')

  await snapshot('side-by-side')

  return { partId }
}
