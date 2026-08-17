// Q3: How do chordHeightTol and angleTol interact when both are set?
// Hypothesis: the more restrictive constraint (whichever demands more triangles) wins.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Interaction' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result

  const combos = [
    // chord-only baselines (angleTol=0 means disabled)
    { cht: 0.1, at: 0, label: 'chord-only-0.1' },
    { cht: 0.5, at: 0, label: 'chord-only-0.5' },
    { cht: 1, at: 0, label: 'chord-only-1' },
    // angle-only baselines (cht very high so it doesn't constrain)
    { cht: 100, at: 5, label: 'angle-only-5' },
    { cht: 100, at: 15, label: 'angle-only-15' },
    { cht: 100, at: 30, label: 'angle-only-30' },
    // Both set — chord tight, angle loose
    { cht: 0.1, at: 30, label: 'chord-tight-angle-loose' },
    // Both set — chord loose, angle tight
    { cht: 1, at: 5, label: 'chord-loose-angle-tight' },
    // Both tight
    { cht: 0.01, at: 5, label: 'both-tight' },
    // Both loose
    { cht: 5, at: 30, label: 'both-loose' },
  ]

  const results = []
  for (const c of combos) {
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: c.cht, angleTol: c.at })
    const r = await api.v1.common.requestVisualisation({ ids: [sphId] })
    let totalVerts = 0
    for (const cont of (r.graphic?.containers || [])) {
      for (const m of (cont.meshes || [])) totalVerts += (m.vertices?.length || 0) / 3
    }
    results.push({ label: c.label, chordHeightTol: c.cht, angleTol: c.at, vertices: totalVerts })
    console.log(`[03] ${c.label}: cht=${c.cht}, at=${c.at} → verts=${totalVerts}`)
  }

  filewrite(results, 'interaction')
  return { partId }
}
