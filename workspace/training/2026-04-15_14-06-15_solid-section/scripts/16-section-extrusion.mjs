// 16 — Section of an extrusion (L-shaped profile extruded)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionExtrusion' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create an L-shaped profile
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 15 },
      { xa: 15, ya: 15 },
      { xa: 15, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  // Extrude along Z
  const extId = (await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: shapeId,
  })).result
  console.log('[16] extrusionId:', extId)

  await snapshot('before')

  // Section at z=15 (middle of extrusion)
  const r = await api.v1.solid.section({
    id: eifId,
    target: extId,
    originPos: [0, 0, 15],
    normal: [0, 0, 1],
  })

  console.log('[16] section result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'graphic')

  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[16] edges:', c.edges.length)
      for (const e of c.edges) {
        console.log(`[16]   edge ${e.id}: ${e.points.length / 3} pts`)
      }
    }
  }

  await snapshot('after')

  return { partId, eifId, extId, sectionId: r.result }
}
