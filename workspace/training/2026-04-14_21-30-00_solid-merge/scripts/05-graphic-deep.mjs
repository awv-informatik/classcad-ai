// 05 — Dig into graphic.containers structure. Compare merge vs union topology.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GraphicDeep' })).result

  // --- MERGE ---
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const mB1 = (await api.v1.solid.box({ id: eif1, length: 100, width: 60, height: 40 })).result
  const mB2 = (await api.v1.solid.box({
    id: eif1, length: 60, width: 40, height: 80, translation: [60, 30, 0]
  })).result
  const mergeR = await api.v1.solid.merge({ id: eif1, target: mB1, tools: [mB2] })

  // Dig into graphic containers
  const dumpContainers = (g, label) => {
    if (!g || !g.containers) { console.log(`[05] ${label}: no containers`); return }
    console.log(`[05] ${label} containers count:`, g.containers.length)
    for (let i = 0; i < g.containers.length; i++) {
      const c = g.containers[i]
      console.log(`[05] ${label} container[${i}]: keys=[${Object.keys(c)}], id=${c.id}`)
      if (c.meshes) {
        console.log(`[05]   meshes count:`, c.meshes.length)
        for (let j = 0; j < c.meshes.length; j++) {
          const m = c.meshes[j]
          const verts = m.vertices ? m.vertices.length / 3 : 0
          const tris = m.indices ? m.indices.length / 3 : 0
          console.log(`[05]   mesh[${j}]: ${verts} verts, ${tris} tris, keys=[${Object.keys(m)}]`)
        }
      }
      if (c.edges) {
        console.log(`[05]   edges count:`, c.edges.length)
      }
    }
  }

  dumpContainers(mergeR.graphic, 'merge')

  // --- UNION ---
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const uB1 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40, translation: [0, 0, 120] })).result
  const uB2 = (await api.v1.solid.box({
    id: eif2, length: 60, width: 40, height: 80, translation: [60, 30, 120]
  })).result
  const unionR = await api.v1.solid.union({ id: eif2, target: uB1, tools: [uB2] })

  dumpContainers(unionR.graphic, 'union')

  await snapshot('both')

  return { partId }
}
