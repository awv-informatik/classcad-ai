// 02 — Inspect the section result: what is the returned ID? What's in the structure?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionInspect' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  const sectionId = r.result
  console.log('[02] sectionId:', sectionId)

  // Dump the full structure tree to understand what the section created
  filewrite(r.structure, 'structure')

  // Dump graphic data to inspect curve/edge details
  filewrite(r.graphic, 'graphic')

  // Check if the box solid still exists by looking at containers
  const containers = r.graphic?.containers || []
  console.log('[02] container count:', containers.length)
  for (let i = 0; i < containers.length; i++) {
    const c = containers[i]
    console.log(`[02] container[${i}]: id=${c.id}, type=${c.type}, verts=${c.vertices?.length || 0}`)
  }

  // Check edges (section curves might appear as edges)
  const edges = r.graphic?.edges || []
  console.log('[02] edges array length:', edges.length)
  if (edges.length > 0) {
    for (let i = 0; i < Math.min(edges.length, 5); i++) {
      const e = edges[i]
      console.log(`[02] edges[${i}]: id=${e.id}, vertexCount=${e.vertices?.length || 0}`)
    }
  }

  await snapshot('result')

  return { partId, eifId, boxId, sectionId }
}
