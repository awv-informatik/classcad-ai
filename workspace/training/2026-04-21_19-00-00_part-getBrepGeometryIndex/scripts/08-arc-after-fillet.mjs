export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get an edge to fillet
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }], // front-left vertical
  })
  const edgeId = geoR.result.lines[0]

  // Apply fillet
  const filletId = (await api.v1.part.fillet({ id: partId, references: [edgeId], radius: 8 })).result
  await api.v1.common.recalc({})

  // After fillet, the original edge is replaced by arc edges
  // Find arcs near where the fillet is
  const geoPost = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [
      { pos: [0, 0, 20] }, // where the original edge was — now an arc
    ],
    circles: [
      { pos: [0, 0, 20] }, // try circle too
    ],
  })
  console.log('[08] arcs:', JSON.stringify(geoPost.result.arcs), 'maxLevel:', geoPost.maxLevel)
  console.log('[08] circles:', JSON.stringify(geoPost.result.circles))

  // Try indexing the arc against the fillet feature
  const results = []
  if (geoPost.result.arcs && geoPost.result.arcs[0]) {
    const arcId = geoPost.result.arcs[0]
    // Index against fillet feature
    const rFillet = await api.v1.part.getBrepGeometryIndex({ id: filletId, geomId: arcId })
    console.log('[08] arc → fillet feature: index', rFillet.result, 'maxLevel:', rFillet.maxLevel)
    results.push({ test: 'arc→filletFeature', arcId, index: rFillet.result, maxLevel: rFillet.maxLevel })

    // Index against box feature (might be -1 since fillet changed topology)
    const rBox = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: arcId })
    console.log('[08] arc → box feature: index', rBox.result, 'maxLevel:', rBox.maxLevel)
    results.push({ test: 'arc→boxFeature', arcId, index: rBox.result, maxLevel: rBox.maxLevel })

    // Round-trip arc: index → getBrepGeometryByIndex with arcIndex
    const arcIdx = rFillet.result
    if (arcIdx !== null && arcIdx >= 0) {
      const rtR = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: arcIdx })
      console.log('[08] round-trip arc: index', arcIdx, '→ id', rtR.result, '(original:', arcId, ')', arcId === rtR.result ? '✓' : '❌')
      results.push({ test: 'arcRoundTrip', originalId: arcId, index: arcIdx, recoveredId: rtR.result, match: arcId === rtR.result })
    }
  }

  filewrite(results, 'arc-fillet-indices')
  await snapshot('fillet')
  return { partId }
}
