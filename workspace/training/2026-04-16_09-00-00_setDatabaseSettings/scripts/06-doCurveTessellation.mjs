// Test doCurveTessellation — edge data format difference (polylines vs analytic curves)
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  // Test with doCurveTessellation = 1 (default, tessellated)
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: 1 })
  const partId1 = (await api.v1.part.create({ name: 'CurveTessOn' })).result
  const eifId1 = (await api.v1.part.entityInjection({ id: partId1, name: 'EIF' })).result
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const cylR1 = await api.v1.solid.cylinder({ id: eifId1, height: 30, diameter: 20 })
  const container1 = cylR1.graphic?.containers?.[0]
  console.log('[06] doCurveTessellation=1:')
  console.log('[06]   has edges:', !!(container1?.edges?.length))
  console.log('[06]   has lines:', !!(container1?.lines?.length))
  console.log('[06]   has arcs:', !!(container1?.arcs?.length))
  console.log('[06]   edge count:', container1?.edges?.length || 0)

  // Test with doCurveTessellation = 0 (analytic)
  await api.v1.common.clear({})
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: 0, facetingParamsMode: 0 })
  const partId2 = (await api.v1.part.create({ name: 'CurveTessOff' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF' })).result
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const cylR2 = await api.v1.solid.cylinder({ id: eifId2, height: 30, diameter: 20 })
  const container2 = cylR2.graphic?.containers?.[0]
  console.log('[06] doCurveTessellation=0:')
  console.log('[06]   has edges:', !!(container2?.edges?.length))
  console.log('[06]   has lines:', !!(container2?.lines?.length))
  console.log('[06]   has arcs:', !!(container2?.arcs?.length))
  if (container2?.lines) console.log('[06]   lines count:', container2.lines.length)
  if (container2?.arcs) console.log('[06]   arcs count:', container2.arcs.length)
  if (container2?.edges) console.log('[06]   edges count:', container2.edges.length)

  filewrite({
    tessOn: { edgeCount: container1?.edges?.length || 0, hasLines: !!(container1?.lines?.length), hasArcs: !!(container1?.arcs?.length) },
    tessOff: { edgeCount: container2?.edges?.length || 0, hasLines: !!(container2?.lines?.length), hasArcs: !!(container2?.arcs?.length) },
    containerKeysOn: container1 ? Object.keys(container1) : [],
    containerKeysOff: container2 ? Object.keys(container2) : [],
  }, 'curve-tessellation')

  return {}
}
