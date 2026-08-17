// 04 — genIncidence flag: does it auto-coincide center with existing points?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncidenceTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a standalone point at (30, 20, 0)
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [30, 20, 0], genFixation: false })).result
  console.log('[04] point:', ptId)

  // Circle 1: center exactly at the point, genIncidence=true (default)
  const r1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })
  const c1 = r1.result
  console.log('[04] circle1 (coincident, genInc=true):', c1)

  // Circle 2: center exactly at the point, genIncidence=false
  const r2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 15, genIncidence: false })
  const c2 = r2.result
  console.log('[04] circle2 (coincident, genInc=false):', c2)

  // Check constraints in structure
  const tree = r2.structure?.tree
  if (tree) {
    const sk = tree[String(skId)]
    const allChildren = sk?.children || []
    for (const cid of allChildren) {
      const node = tree[String(cid)]
      if (node?.class?.includes('Constraint')) {
        console.log('[04] constraint:', node.id, node.class, node.name)
      }
    }
  }

  await snapshot('incidence-test')
  return { partId }
}
