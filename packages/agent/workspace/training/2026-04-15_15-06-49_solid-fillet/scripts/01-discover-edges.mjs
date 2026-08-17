// 01 — Discover brep edge IDs from a box solid via graphic data
// Before we can fillet, we need to know how to get edge IDs.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletEdgeDiscovery' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const r = await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const boxId = r.result
  console.log('[01] boxId:', boxId)

  // Dump edges from graphic data — these contain brep edge IDs
  const edges = r.graphic?.edges || []
  console.log('[01] edge count:', edges.length)
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    console.log(`[01] edge[${i}]: id=${e.id}, vertexCount=${e.vertices?.length || 0}`)
  }

  // Also dump the edge IDs as a compact list
  const edgeIds = edges.map(e => e.id)
  console.log('[01] all edge IDs:', JSON.stringify(edgeIds))

  filewrite({ boxId, edgeCount: edges.length, edgeIds, edgeSample: edges.slice(0, 3) }, 'edge-discovery')

  await snapshot('box-before-fillet')

  return { partId, eifId, boxId, edgeIds }
}
