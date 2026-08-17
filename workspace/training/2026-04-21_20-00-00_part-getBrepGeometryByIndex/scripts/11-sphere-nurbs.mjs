export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const sphId = (await api.v1.part.sphere({ id: partId, radius: 30 })).result
  await api.v1.common.recalc({})

  // Sphere may have NURBS curves (or just arcs). Let's enumerate all types.
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

  const lines = await enumerate(sphId, 'lineIndex')
  const arcs = await enumerate(sphId, 'arcIndex')
  const faces = await enumerate(sphId, 'faceIndex')
  const points = await enumerate(sphId, 'pointIndex')
  const nurbs = await enumerate(sphId, 'nurbsCurveIndex')

  console.log(`[11] sphere lines: ${lines.length}`)
  console.log(`[11] sphere arcs: ${arcs.length}`)
  console.log(`[11] sphere faces: ${faces.length}`)
  console.log(`[11] sphere points: ${points.length}`)
  console.log(`[11] sphere nurbs: ${nurbs.length}`)

  filewrite({ lines, arcs, faces, points, nurbs }, 'sphere-brep')
  await snapshot('sphere')
  return { partId }
}
