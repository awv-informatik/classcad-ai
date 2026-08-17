// 08 — Section of a cone at different heights
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionCone' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Cone: height=60, bDiameter=40, tDiameter=10, centered at origin
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 60, bDiameter: 40, tDiameter: 10 })).result
  console.log('[08] coneId:', coneId)

  // Section at z=0 (middle of the cone)
  const r = await api.v1.solid.section({
    id: eifId,
    target: coneId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  console.log('[08] section result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'graphic')

  // Inspect edges
  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[08] container id:', c.id, 'edges:', c.edges.length)
      for (const e of c.edges) {
        console.log('[08]   edge id:', e.id, 'points:', e.points.length / 3)
      }
      // Check bounding box to estimate radius at z=0
      console.log('[08] bbox min:', JSON.stringify(c.properties?.min))
      console.log('[08] bbox max:', JSON.stringify(c.properties?.max))
    }
  }

  await snapshot('result')

  return { partId, eifId, coneId, sectionId: r.result }
}
