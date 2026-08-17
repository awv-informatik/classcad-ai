// Debug: inspect graphic structure to find vertex data path
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.5 })

  const partId = (await api.v1.part.create({ name: 'Debug' })).result
  const r = await api.v1.solid.sphere({ id: partId, center: [0, 0, 0], radius: 20 })

  // Log top-level graphic keys
  const gKeys = r.graphic ? Object.keys(r.graphic) : 'null'
  console.log('[08] graphic keys:', gKeys)

  if (r.graphic) {
    // Check meshes
    if (r.graphic.meshes) {
      console.log('[08] meshes count:', r.graphic.meshes.length)
      if (r.graphic.meshes[0]) {
        const m = r.graphic.meshes[0]
        console.log('[08] mesh[0] keys:', Object.keys(m))
        if (m.vertices) console.log('[08] vertices type:', typeof m.vertices, 'length:', m.vertices.length)
        if (m.positions) console.log('[08] positions type:', typeof m.positions, 'length:', m.positions.length)
      }
    }
    // Dump a subset of graphic for analysis
    const subset = {}
    for (const k of Object.keys(r.graphic)) {
      const v = r.graphic[k]
      if (Array.isArray(v)) {
        subset[k] = { type: 'array', length: v.length, sample: v.slice(0, 2) }
      } else if (typeof v === 'object' && v !== null) {
        subset[k] = { type: 'object', keys: Object.keys(v) }
      } else {
        subset[k] = v
      }
    }
    filewrite(subset, 'graphic-structure')
  }
  return { partId }
}
