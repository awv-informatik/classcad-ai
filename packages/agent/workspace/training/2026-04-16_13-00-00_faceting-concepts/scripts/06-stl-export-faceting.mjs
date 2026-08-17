// Q6: Does stl.facetingTol in save() use its own tessellation independent of database settings?
// STL export has its own facetingTol and angleTol params (defaults: 0.1 and 6).
// Compare STL file sizes at different stl.facetingTol values.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STLExport' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result

  // Set database settings to some specific value
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 0 })

  // Export STL with different facetingTol values — use ASCII for readable size comparison
  const stlTests = [
    { facetingTol: 0.01, angleTol: 6, label: 'fine' },
    { facetingTol: 0.1, angleTol: 6, label: 'default' },
    { facetingTol: 0.5, angleTol: 6, label: 'medium' },
    { facetingTol: 1, angleTol: 6, label: 'coarse' },
    { facetingTol: 5, angleTol: 6, label: 'veryCoarse' },
    // Also test angleTol variation
    { facetingTol: 0.1, angleTol: 1, label: 'tightAngle' },
    { facetingTol: 0.1, angleTol: 30, label: 'looseAngle' },
  ]

  const results = []
  for (const t of stlTests) {
    const r = await api.v1.common.save({
      format: 'STL',
      encoding: 'base64',
      stl: { facetingTol: t.facetingTol, angleTol: t.angleTol, binary: false },
    })
    const contentLen = r.result?.content?.length || 0
    // ASCII STL — count "facet normal" occurrences as proxy for triangle count
    let triangleCount = 0
    if (r.result?.content) {
      // Decode base64 to check text content size
      const decoded = Buffer.from(r.result.content, 'base64').toString('utf-8')
      triangleCount = (decoded.match(/facet normal/g) || []).length
    }
    results.push({
      label: t.label,
      facetingTol: t.facetingTol,
      angleTol: t.angleTol,
      base64Length: contentLen,
      triangles: triangleCount,
    })
    console.log(`[06] ${t.label}: facetTol=${t.facetingTol}, angTol=${t.angleTol} → ${triangleCount} triangles, ${contentLen} b64 chars`)
  }

  filewrite(results, 'stl-export')

  // Reset
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  return { partId }
}
