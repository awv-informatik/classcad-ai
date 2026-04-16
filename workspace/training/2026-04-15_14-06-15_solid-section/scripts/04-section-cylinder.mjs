// 04 — Section of a cylinder at different planes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionCylinder' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Cylinder along Z axis, height=60, diameter=40
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 40 })).result
  console.log('[04] cylinderId:', cylId)

  // Section 1: horizontal (XY plane) — should give a circle
  const r1 = await api.v1.solid.section({
    id: eifId,
    target: cylId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })
  console.log('[04] horizontal section result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite(r1.graphic, 'graphic-horiz')

  // Count edges for horizontal section
  const c1 = r1.graphic?.containers?.find(c => c.edges)
  if (c1) {
    console.log('[04] horiz container edges:', c1.edges.length)
    for (const e of c1.edges) {
      console.log('[04]   edge id:', e.id, 'points:', e.points.length / 3)
    }
  }

  // Section 2: diagonal plane — should give an ellipse
  const r2 = await api.v1.solid.section({
    id: eifId,
    target: cylId,
    originPos: [0, 0, 0],
    normal: [1, 0, 1],  // 45° between X and Z
  })
  console.log('[04] diagonal section result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.graphic, 'graphic-diag')

  const c2 = r2.graphic?.containers?.filter(c => c.edges) || []
  for (const c of c2) {
    console.log('[04] diag container id:', c.id, 'edges:', c.edges.length)
    for (const e of c.edges) {
      console.log('[04]   edge id:', e.id, 'points:', e.points.length / 3)
    }
  }

  await snapshot('result')

  return { partId, eifId, cylId, hSectionId: r1.result, dSectionId: r2.result }
}
