// 03 — Section of a sphere (should produce a circular cross-section)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionSphere' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result
  console.log('[03] sphereId:', sphId)

  await snapshot('before')

  // Section at z=10 (above center) — should produce a smaller circle
  const r = await api.v1.solid.section({
    id: eifId,
    target: sphId,
    originPos: [0, 0, 10],
    normal: [0, 0, 1],
  })

  console.log('[03] sectionId:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)

  // Dump graphic to inspect the curve (circle vs polygon approximation?)
  filewrite(r.graphic, 'graphic')

  // Count edges in the section result
  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[03] container id:', c.id, 'edge count:', c.edges.length)
      for (const e of c.edges) {
        console.log('[03]   edge id:', e.id, 'pointCount:', e.points.length / 3)
      }
    }
  }

  await snapshot('after')

  return { partId, eifId, sphId, sectionId: r.result }
}
