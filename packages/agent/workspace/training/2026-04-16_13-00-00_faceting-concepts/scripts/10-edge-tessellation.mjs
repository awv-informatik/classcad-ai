// Q: How does chordHeightTol affect edge tessellation (separate from mesh tessellation)?
// Edge tessellation is controlled by doCurveTessellation AND the tolerance.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeTess' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 30, diameter: 40 })).result

  const results = []

  // Test with doCurveTessellation=true (default) — edges are polylines
  for (const cht of [0.01, 0.1, 1, 5]) {
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: cht, angleTol: 0 })
    await api.v1.common.setDatabaseSettings({ doCurveTessellation: true })
    const r = await api.v1.common.requestVisualisation({ ids: [cylId] })
    const c = r.graphic?.containers?.[0]
    let edgePointTotal = 0
    const edgeCount = (c?.edges || []).length
    for (const e of (c?.edges || [])) {
      edgePointTotal += (e.points?.length || 0) / 3
    }
    results.push({ cht, doCurveTess: true, edgeCount, edgePointTotal })
    console.log(`[10] cht=${cht}, tess=true: ${edgeCount} edges, ${edgePointTotal} edge pts`)
  }

  // Test with doCurveTessellation=false — edges are analytic
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: false })
  const r2 = await api.v1.common.requestVisualisation({ ids: [cylId] })
  const c2 = r2.graphic?.containers?.[0]
  const hasEdges = !!(c2?.edges)
  const hasLines = !!(c2?.lines)
  const hasArcs = !!(c2?.arcs)
  results.push({ cht: 'n/a', doCurveTess: false, hasEdges, hasLines, hasArcs,
    lineCount: c2?.lines?.length, arcCount: c2?.arcs?.length })
  console.log(`[10] tess=false: edges=${hasEdges}, lines=${hasLines}(${c2?.lines?.length}), arcs=${hasArcs}(${c2?.arcs?.length})`)

  filewrite(results, 'edge-tessellation')

  // Reset
  await api.v1.common.setDatabaseSettings({ doCurveTessellation: true, chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  return { partId }
}
