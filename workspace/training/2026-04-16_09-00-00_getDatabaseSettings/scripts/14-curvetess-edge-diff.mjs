// 14 — Compare edge data between doCurveTessellation on vs off
// Script 12 showed a ~7KB difference. Let's look at the edge arrays specifically.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurveEdgeDiff' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // With doCurveTessellation=true
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })
  const cylR1 = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30 })
  const g1 = cylR1.graphic

  // Extract edge info per container
  if (g1?.containers) {
    for (let i = 0; i < g1.containers.length; i++) {
      const c = g1.containers[i]
      console.log(`[14] ON Container[${i}]:`, Object.keys(c).join(','))
      if (c.edges) {
        console.log(`[14] ON Container[${i}] edges:`, c.edges.length, 'items')
        for (let j = 0; j < Math.min(c.edges.length, 3); j++) {
          const e = c.edges[j]
          console.log(`[14] ON   edge[${j}] keys:`, Object.keys(e).join(','), 'vertices:', e.vertices?.length)
        }
      }
    }
  }

  // With doCurveTessellation=false
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: false })
  const cylR2 = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30, translation: [50, 0, 0] })
  const g2 = cylR2.graphic

  if (g2?.containers) {
    for (let i = 0; i < g2.containers.length; i++) {
      const c = g2.containers[i]
      console.log(`[14] OFF Container[${i}]:`, Object.keys(c).join(','))
      if (c.edges) {
        console.log(`[14] OFF Container[${i}] edges:`, c.edges.length, 'items')
        for (let j = 0; j < Math.min(c.edges.length, 3); j++) {
          const e = c.edges[j]
          console.log(`[14] OFF   edge[${j}] keys:`, Object.keys(e).join(','), 'vertices:', e.vertices?.length)
        }
      }
    }
  }

  // Restore
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })

  // Count total edge vertices in each
  let totalVertON = 0, totalVertOFF = 0
  if (g1?.containers) g1.containers.forEach(c => c.edges?.forEach(e => { totalVertON += (e.vertices?.length || 0) }))
  if (g2?.containers) g2.containers.forEach(c => c.edges?.forEach(e => { totalVertOFF += (e.vertices?.length || 0) }))
  console.log('[14] Total edge vertices ON:', totalVertON, 'OFF:', totalVertOFF)

  filewrite({ totalVertON, totalVertOFF }, 'edge-vertex-counts')

  return { totalVertON, totalVertOFF }
}
