// 17 — Does normal direction matter? Compare [0,0,1] vs [0,0,-1] sections
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionNormalDir' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Section with normal [0,0,1] (pointing up)
  const r1 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 5],
    normal: [0, 0, 1],
  })
  console.log('[17] normal [0,0,1] result:', r1.result, 'maxLevel:', r1.maxLevel)

  const c1 = r1.graphic?.containers?.find(c => c.edges) || {}
  console.log('[17] [0,0,1] edges:', c1.edges?.length)
  console.log('[17] [0,0,1] bbox:', JSON.stringify(c1.properties?.min), JSON.stringify(c1.properties?.max))

  // Section with normal [0,0,-1] (pointing down) at same position
  const r2 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 5],
    normal: [0, 0, -1],
  })
  console.log('[17] normal [0,0,-1] result:', r2.result, 'maxLevel:', r2.maxLevel)

  const c2 = r2.graphic?.containers?.find(c => c.edges) || {}
  console.log('[17] [0,0,-1] edges:', c2.edges?.length)
  console.log('[17] [0,0,-1] bbox:', JSON.stringify(c2.properties?.min), JSON.stringify(c2.properties?.max))

  // Compare edge points
  if (c1.edges && c2.edges) {
    const pts1 = c1.edges.map(e => e.points).flat()
    const pts2 = c2.edges.map(e => e.points).flat()
    const same = pts1.length === pts2.length && pts1.every((v, i) => Math.abs(v - pts2[i]) < 0.001)
    console.log('[17] edge data identical:', same)
  }

  filewrite(c1.edges, 'edges-up')
  filewrite(c2.edges, 'edges-down')

  await snapshot('both-sections')

  return { partId, eifId, boxId }
}
