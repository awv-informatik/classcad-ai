// Q4 extended: Test faceting impact across different geometry types.
// Box (flat), cylinder (single curvature), sphere (double curvature), cone (variable curvature).
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeoTypes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 40, translation: [60, 0, 0] })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [120, 0, 0] })).result
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 40, bDiameter: 40, tDiameter: 10, translation: [180, 0, 0] })).result
  console.log('[07] box:', boxId, 'cyl:', cylId, 'sph:', sphId, 'cone:', coneId)

  const getVerts = (r) => {
    let v = 0
    for (const c of (r.graphic?.containers || [])) {
      for (const m of (c.meshes || [])) v += (m.vertices?.length || 0) / 3
    }
    return v
  }

  const tolerances = [0.01, 0.1, 1, 5]
  const results = []

  for (const cht of tolerances) {
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: cht, angleTol: 0 })
    const rBox = await api.v1.common.requestVisualisation({ ids: [boxId] })
    const rCyl = await api.v1.common.requestVisualisation({ ids: [cylId] })
    const rSph = await api.v1.common.requestVisualisation({ ids: [sphId] })
    const rCone = await api.v1.common.requestVisualisation({ ids: [coneId] })

    const row = {
      chordHeightTol: cht,
      box: getVerts(rBox),
      cylinder: getVerts(rCyl),
      sphere: getVerts(rSph),
      cone: getVerts(rCone),
    }
    results.push(row)
    console.log(`[07] cht=${cht}: box=${row.box}, cyl=${row.cylinder}, sph=${row.sphere}, cone=${row.cone}`)
  }

  filewrite(results, 'geometry-types')
  return { partId }
}
