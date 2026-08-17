export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const coneId = (await api.v1.part.cone({ id: partId, bDiameter: 60, tDiameter: 20, height: 80 })).result
  await api.v1.common.recalc({})

  const enumerate = async (featureId, type, maxGuess = 10) => {
    const results = []
    for (let i = 0; i < maxGuess; i++) {
      const param = { id: featureId }
      param[type] = i
      const r = await api.v1.part.getBrepGeometryByIndex(param)
      if (r.result === null) break
      results.push({ index: i, id: r.result })
    }
    return results
  }

  const lines = await enumerate(coneId, 'lineIndex')
  const arcs = await enumerate(coneId, 'arcIndex')
  const faces = await enumerate(coneId, 'faceIndex')
  const points = await enumerate(coneId, 'pointIndex')
  const nurbs = await enumerate(coneId, 'nurbsCurveIndex')

  console.log(`[13] cone: lines=${lines.length}, arcs=${arcs.length}, faces=${faces.length}, points=${points.length}, nurbs=${nurbs.length}`)

  // Also test positions for the arc IDs to verify correctness
  if (arcs.length > 0) {
    const arcIds = arcs.map(a => a.id)
    const posR = await api.v1.part.getGeometryPositions({ id: partId, ids: arcIds })
    filewrite({ arcPositions: posR.result }, 'cone-arc-positions')
  }

  filewrite({ lines, arcs, faces, points, nurbs }, 'cone-brep')
  await snapshot('cone')
  return { partId }
}
