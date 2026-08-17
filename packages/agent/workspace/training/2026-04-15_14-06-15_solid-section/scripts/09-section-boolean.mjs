// 09 — Section of a boolean result (union of box + cylinder with hole)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionBoolean' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Create a cylinder hole through the box center
  const cylId = (await api.v1.solid.cylinder({
    id: eifId,
    height: 60,
    diameter: 20,
  })).result

  // Subtract cylinder from box
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  await snapshot('before')

  // Section at z=0 — should show rectangle with circular hole
  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  console.log('[09] section result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'graphic')

  // Count edges
  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[09] container id:', c.id, 'edges:', c.edges.length)
      for (const e of c.edges) {
        console.log('[09]   edge id:', e.id, 'points:', e.points.length / 3)
      }
    }
  }

  await snapshot('after')

  return { partId, eifId, boxId, sectionId: r.result }
}
