// Q4: Does faceting affect flat faces (box) or only curved geometry (sphere, cylinder)?
// A box has only planar faces — tessellation tolerance should not change vertex count.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FlatVsCurved' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 30, diameter: 20, translation: [60, 0, 0] })).result
  console.log('[04] box:', boxId, 'cyl:', cylId)

  const tolerances = [0.01, 0.1, 0.5, 1, 5]
  const results = []

  for (const cht of tolerances) {
    // Set per-entity (whole EIF, both solids inherit)
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: cht, angleTol: 0 })
    const rBox = await api.v1.common.requestVisualisation({ ids: [boxId] })
    const rCyl = await api.v1.common.requestVisualisation({ ids: [cylId] })

    const getVerts = (r) => {
      let v = 0
      for (const c of (r.graphic?.containers || [])) {
        for (const m of (c.meshes || [])) v += (m.vertices?.length || 0) / 3
      }
      return v
    }

    const boxVerts = getVerts(rBox)
    const cylVerts = getVerts(rCyl)
    results.push({ chordHeightTol: cht, boxVertices: boxVerts, cylinderVertices: cylVerts })
    console.log(`[04] cht=${cht}: box=${boxVerts} verts, cyl=${cylVerts} verts`)
  }

  filewrite(results, 'flat-vs-curved')
  return { partId }
}
